import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),engine=require('../projeto-demografia-ufmg/engine.js'),modes=require('../projeto-demografia-ufmg/modes.js');
const bytes=readFileSync(new URL('../projeto-demografia-ufmg/data/countries.json',import.meta.url));
const catalog=JSON.parse(bytes).countries,byId=new Map(catalog.map(card=>[card.id,card])),familiar=new Set(modes.EASY_IDS);
const matchesPerProfile=5000,firstSeed=120001;
function seeded(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const profiles=[
  {id:'random',name:'Escolha aleatória'},
  {id:'basic',name:'Conhecimento básico',rankWeights:[.55,.30,.15],uncertainty:.35},
  {id:'intermediate',name:'Conhecimento intermediário',rankWeights:[.70,.25,.05],uncertainty:.15},
  {id:'advanced',name:'Conhecimento elevado',rankWeights:[.90,.09,.01],uncertainty:.06},
];
function weightedChoice(ranked,weights,random){
  const active=weights.slice(0,ranked.length),sum=active.reduce((a,b)=>a+b,0),draw=random()*sum;let cumulative=0;
  for(let i=0;i<active.length;i++){cumulative+=active[i];if(draw<cumulative)return ranked[i].id;}
  return ranked[Math.min(active.length,ranked.length)-1].id;
}
function playerChoice(view,profile,random){
  if(profile.id==='random')return view.playerHand[Math.floor(random()*view.playerHand.length)].id;
  if(view.mode.visibleValues){
    // Values are actually visible in Easy and Normal. No memory lookup or opponent model.
    const direction=view.rule.objective==='higher'?-1:1;
    const ranked=engine.shuffle(view.playerHand,random).sort((a,b)=>direction*(a[view.rule.indicator]-b[view.rule.indicator]));
    return profile.id==='advanced'?ranked[0].id:weightedChoice(ranked,profile.rankWeights,random);
  }
  // Simulated prior knowledge resolves ONLY the active own IDs, never adversary
  // IDs/values, commitments, reserves or future rules. This is not the real UI.
  const own=view.playerHand.map(card=>byId.get(card.id));
  const unfamiliarFraction=own.filter(card=>!familiar.has(card.id)).length/own.length;
  const settings={rankWeights:profile.rankWeights,uncertainty:profile.uncertainty*(1+.8*unfamiliarFraction)};
  const hand=engine.estimateOwnHand(own,view.rule,random,settings);
  return engine.chooseComputerCard({hand,objective:view.rule.objective},random,settings);
}
const results=[];
for(const mode of Object.keys(modes.MODES))for(const profile of profiles){
  const counts={computerWins:0,playerWins:0,draws:0,computerPoints:0,playerPoints:0,tiedRounds:0};
  const deals=new Set(),schedules=new Set();
  for(let run=0;run<matchesPerProfile;run++){
    const seed=firstSeed+run,game=engine.createGame(catalog,{mode,random:seeded(seed)}),playerRandom=seeded(seed^0xA631D58F);
    const initial=engine.getView(game);deals.add(initial.playerDeck.map(c=>c.id).sort().join(','));
    if(mode==='normal')assert.equal(initial.playerDeck.filter(c=>modes.KNOWN_IDS.includes(c.id)).length,6);
    const rules=[];
    for(let round=0;round<12;round++){
      const view=engine.getView(game);rules.push(view.rule);
      assert.equal(view.playerHand.length,mode==='easy'?12-round:Math.min(3,12-round));
      assert.equal(view.computerHandCount,Math.min(3,12-round));
      assert.ok(engine.selectCard(game,playerChoice(view,profile,playerRandom)));assert.ok(engine.reveal(game));assert.ok(engine.next(game));
    }
    for(const indicator of engine.KEYS)for(const objective of ['higher','lower'])assert.equal(rules.filter(r=>r.indicator===indicator&&r.objective===objective).length,1);
    schedules.add(JSON.stringify(rules));const end=engine.getView(game);
    assert.ok(end.finished);assert.equal(end.playerScore+end.computerScore+end.ties,12);
    assert.equal(new Set(end.history.flatMap(r=>[r.playerCard.id,r.computerCard.id])).size,24);
    const computerIds=end.history.map(r=>r.computerCard.id);
    if(mode==='normal')assert.equal(computerIds.filter(id=>modes.KNOWN_IDS.includes(id)).length,6);
    if(end.computerScore>end.playerScore)counts.computerWins++;else if(end.playerScore>end.computerScore)counts.playerWins++;else counts.draws++;
    counts.computerPoints+=end.computerScore;counts.playerPoints+=end.playerScore;counts.tiedRounds+=end.ties;
  }
  const percent=n=>100*n/matchesPerProfile;
  results.push({mode,profile:profile.id,name:profile.name,matches:matchesPerProfile,...counts,computerWinPercent:percent(counts.computerWins),playerWinPercent:percent(counts.playerWins),drawPercent:percent(counts.draws),meanComputerPoints:counts.computerPoints/matchesPerProfile,meanPlayerPoints:counts.playerPoints/matchesPerProfile,uniquePlayerDecks:deals.size,uniqueSchedules:schedules.size});
}
const rng=seeded(5817),audit={hands:0,estimatedBestNotTrueBest:0};
for(const indicator of engine.KEYS)for(let run=0;run<2000;run++){
  const objective=run%2?'higher':'lower',own=engine.shuffle(catalog,rng).slice(0,3),estimated=engine.estimateOwnHand(own,{indicator},rng);
  const sign=objective==='higher'?-1:1,top=[...estimated].sort((a,b)=>sign*(a.estimate-b.estimate))[0];
  const best=Math[objective==='higher'?'max':'min'](...own.map(c=>c[indicator]));
  audit.hands++;if(byId.get(top.id)[indicator]!==best)audit.estimatedBestNotTrueBest++;
}
assert.ok(audit.estimatedBestNotTrueBest>0);
const report={matchesPerProfile,totalMatches:matchesPerProfile*profiles.length*3,totalRounds:matchesPerProfile*profiles.length*3*12,firstSeed,lastSeed:firstSeed+matchesPerProfile-1,computerDifficulty:engine.DEFAULT_DIFFICULTY,datasetSha256:createHash('sha256').update(bytes).digest('hex'),profiles,unfamiliarityModel:{familiarIds:modes.EASY_IDS,uncertaintyMultiplierPerUnfamiliarFraction:.8},results,estimateAudit:audit};
const pct=n=>n.toFixed(2).replace('.',',')+'%',num=n=>n.toFixed(3).replace('.',',');
const tables=Object.entries(modes.MODES).map(([id,mode])=>`## ${mode.name}\n\n| Jogador simulado | Computador vence | Jogador vence | Empate | Pontos médios computador / jogador |\n| --- | ---: | ---: | ---: | ---: |\n${results.filter(r=>r.mode===id).map(r=>`| ${r.name} | ${pct(r.computerWinPercent)} | ${pct(r.playerWinPercent)} | ${pct(r.drawPercent)} | ${num(r.meanComputerPoints)} / ${num(r.meanPlayerPoints)} |`).join('\n')}`).join('\n\n');
const markdown=`# Simulações dos três modos\n\nForam executadas **60.000 partidas completas / 720.000 rodadas**, 5.000 partidas por combinação de modo e perfil. Todas passaram pelas verificações de 12 rodadas, 24 cartas distintas, mão legal, distribuição Normal de seis países por grupo para cada lado, descarte e uma ocorrência de cada indicador em cada objetivo.\n\n${tables}\n\nAs taxas são de partidas; empates ficam separados. Não houve ajuste para aproximar 50%. O mesmo computador usa 70/25/5 e incerteza 0,15 nos três modos. A margem amostral máxima aproximada de cada taxa é de 1,4 ponto percentual a 95%; isso não mede a validade dos modelos de conhecimento.\n\n## Perfis e limites\n\n- Aleatório: escolha uniforme entre todas as cartas legalmente disponíveis, sem consultar números.\n- Básico: pesos 55/30/15; incerteza-base 0,35 quando há valores ocultos.\n- Intermediário: pesos 70/25/5; incerteza-base 0,15 quando há valores ocultos.\n- Elevado: pesos 90/9/1; incerteza-base 0,06 quando há valores ocultos.\n\nNo Fácil e no Normal os valores são visíveis de fato. Básico e intermediário ordenam os valores atuais e sorteiam entre as três primeiras alternativas com seus pesos, para representar erros de leitura/decisão. O perfil elevado escolhe o melhor valor atual entre as cartas legalmente disponíveis (todas as restantes no Fácil; a mão no Normal), sem prever adversário ou rodadas futuras. Isso explica a vantagem educacional desse modo; não equivale a uma estratégia global ótima.\n\nSomente no Difícil, um modelo de memória resolve apenas os IDs da própria mão ativa. Para representar a menor familiaridade, a incerteza-base é multiplicada por 1 + 0,8 × fração de países da mão fora da lista Fácil. Essa hipótese é explícita e usada SOMENTE nos jogadores simulados do Difícil. No Normal, a leitura dos valores substitui a memória de números ocultos. O robô não recebe essa alteração. Não é uma medição do conhecimento real do público.\n\nNenhum perfil consulta IDs ou valores adversários, escolha prévia do robô, reserva ou regras futuras. Os resultados comparam modelos; não estimam probabilidades de vitória de pessoas reais. A variedade mundial não garante uma taxa de derrota maior para todos os modelos: extremos demográficos e o baralho sorteado também influenciam as disputas.\n\n## Verificação da avaliação aproximada\n\nEm ${audit.hands.toLocaleString('pt-BR')} mãos sorteadas do banco mundial, a melhor estimativa do robô não correspondia ao melhor valor real em ${audit.estimatedBestNotTrueBest} casos (${pct(100*audit.estimatedBestNotTrueBest/audit.hands)}). Além desse erro há a escolha ponderada da segunda ou terceira estimativa. Pesos não são chances de vencer: a comparação só ocorre após ambas as decisões.\n\n## Reprodução\n\nExecute \`node scripts/simulate-balance.mjs\`. Cada perfil usa as mesmas sementes ${firstSeed}–${firstSeed+matchesPerProfile-1}, com um gerador independente para decisões do jogador. Cada combinação produziu ${Math.min(...results.map(r=>r.uniquePlayerDecks))} baralhos próprios distintos e ${Math.min(...results.map(r=>r.uniqueSchedules))} sequências distintas. Contagens, configuração e hipóteses estão em \`balance-results.json\`. Dataset SHA-256: \`${report.datasetSha256}\`.\n`;
mkdirSync(new URL('../qa/',import.meta.url),{recursive:true});writeFileSync(new URL('../qa/balance-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');writeFileSync(new URL('../qa/EQUILIBRIO.md',import.meta.url),markdown);
console.log(tables);console.log(`PASS: ${report.totalMatches} matches, ${report.totalRounds} rounds; estimated-best errors ${audit.estimatedBestNotTrueBest}/${audit.hands}.`);

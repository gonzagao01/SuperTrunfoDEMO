import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const engine=require('../projeto-demografia-ufmg/engine.js');
const dataBytes=readFileSync(new URL('../projeto-demografia-ufmg/data/countries.json',import.meta.url));
const catalog=JSON.parse(dataBytes).countries;
const byId=new Map(catalog.map(card=>[card.id,card]));
const matchesPerProfile=5000;
const firstSeed=120001;
function seeded(seed) {
  return ()=>{
    seed|=0;seed=seed+0x6D2B79F5|0;
    let t=Math.imul(seed^seed>>>15,1|seed);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
}
// Models of prior geographic/demographic knowledge, not access granted by the UI.
// Each modeled player uses only its current three countries and the public rule.
// No profile can inspect the opposing hand, commitment, reserve or future rules.
const profiles=[
  {id:'random',name:'Sem conhecimento (escolha aleatória)'},
  {id:'basic',name:'Conhecimento básico',settings:{rankWeights:[.55,.30,.15],uncertainty:.35}},
  {id:'intermediate',name:'Conhecimento intermediário',settings:{rankWeights:[.70,.25,.05],uncertainty:.15}},
  {id:'advanced',name:'Conhecimento elevado',settings:{rankWeights:[.90,.09,.01],uncertainty:.06}},
];
const results=[];
for(const profile of profiles) {
  const counts={computerWins:0,playerWins:0,draws:0,computerPoints:0,playerPoints:0,tiedRounds:0};
  const deals=new Set(),schedules=new Set();
  for(let run=0;run<matchesPerProfile;run++) {
    const seed=firstSeed+run;
    const game=engine.createGame(catalog,seeded(seed));
    // Independent stream: simulated player reasoning never advances the game RNG.
    const playerRandom=seeded(seed^0xA631D58F);
    const initial=engine.getView(game);
    deals.add(initial.playerDeck.map(card=>card.id).sort().join(','));
    const rules=[];
    for(let round=0;round<12;round++) {
      const view=engine.getView(game);
      rules.push(view.rule);
      assert.equal(view.playerHand.length,Math.min(3,12-round));
      assert.equal(view.computerHandCount,view.playerHand.length);
      let selected;
      if(!profile.settings) selected=view.playerHand[Math.floor(playerRandom()*view.playerHand.length)].id;
      else {
        // Only the active own IDs are resolved by this simulated memory model.
        const ownCards=view.playerHand.map(card=>byId.get(card.id));
        const hand=engine.estimateOwnHand(ownCards,view.rule,playerRandom,profile.settings);
        selected=engine.chooseComputerCard({hand,objective:view.rule.objective},playerRandom,profile.settings);
      }
      assert.ok(engine.selectCard(game,selected));
      assert.ok(engine.reveal(game));
      assert.ok(engine.next(game));
    }
    for(const key of engine.KEYS)for(const objective of ['higher','lower'])assert.equal(rules.filter(rule=>rule.indicator===key&&rule.objective===objective).length,1);
    schedules.add(rules.map(rule=>`${rule.indicator}:${rule.objective}`).join(','));
    const final=engine.getView(game);
    assert.ok(final.finished);
    assert.equal(final.playerScore+final.computerScore+final.ties,12);
    assert.equal(new Set(final.history.flatMap(result=>[result.playerCard.id,result.computerCard.id])).size,24);
    if(final.computerScore>final.playerScore) counts.computerWins++;
    else if(final.playerScore>final.computerScore) counts.playerWins++;
    else counts.draws++;
    counts.computerPoints+=final.computerScore;
    counts.playerPoints+=final.playerScore;
    counts.tiedRounds+=final.ties;
  }
  const percent=count=>100*count/matchesPerProfile;
  results.push({...profile,matches:matchesPerProfile,...counts,
    computerWinPercent:percent(counts.computerWins),playerWinPercent:percent(counts.playerWins),drawPercent:percent(counts.draws),
    meanComputerPoints:counts.computerPoints/matchesPerProfile,meanPlayerPoints:counts.playerPoints/matchesPerProfile,
    computerRoundWinPercent:100*counts.computerPoints/(matchesPerProfile*12),
    uniquePlayerDecks:deals.size,uniqueSchedules:schedules.size,
  });
}
// Independently verify that approximate evaluation is not exact own-hand ranking.
const estimateRandom=seeded(5817),audit={hands:0,estimatedBestNotTrueBest:0};
for(const indicator of engine.KEYS)for(let run=0;run<2000;run++) {
  const objective=run%2?'higher':'lower';
  const own=engine.shuffle(catalog,estimateRandom).slice(0,3);
  const estimate=engine.estimateOwnHand(own,{indicator},estimateRandom);
  const direction=objective==='higher'?-1:1;
  const top=[...estimate].sort((a,b)=>direction*(a.estimate-b.estimate))[0];
  const best=Math[objective==='higher'?'max':'min'](...own.map(card=>card[indicator]));
  audit.hands++;
  if(byId.get(top.id)[indicator]!==best) audit.estimatedBestNotTrueBest++;
}
assert.ok(audit.estimatedBestNotTrueBest>0);
const report={matchesPerProfile,totalMatches:matchesPerProfile*profiles.length,totalRounds:matchesPerProfile*profiles.length*12,
  firstSeed,lastSeed:firstSeed+matchesPerProfile-1,computerDifficulty:engine.DEFAULT_DIFFICULTY,
  datasetSha256:createHash('sha256').update(dataBytes).digest('hex'),results,estimateAudit:audit};
const pct=n=>n.toFixed(2).replace('.',',')+'%';
const number=n=>n.toFixed(3).replace('.',',');
const table=['| Jogador simulado | Vitórias do computador | Vitórias do jogador | Empates | Pontos médios computador / jogador |',
  '| --- | ---: | ---: | ---: | ---: |',
  ...results.map(r=>`| ${r.name} | ${pct(r.computerWinPercent)} | ${pct(r.playerWinPercent)} | ${pct(r.drawPercent)} | ${number(r.meanComputerPoints)} / ${number(r.meanPlayerPoints)} |`)];
const markdown=`# Simulações de equilíbrio — dificuldade normal\n\nForam executadas ${report.totalMatches.toLocaleString('pt-BR')} partidas completas (${report.totalRounds.toLocaleString('pt-BR')} rodadas), com ${matchesPerProfile.toLocaleString('pt-BR')} partidas por perfil. Todas concluíram as 12 rodadas com 24 cartas distintas, mãos e reservas válidas e os seis indicadores uma vez em cada objetivo.\n\n${table.join('\n')}\n\nAs porcentagens são de partidas, com empates contabilizados separadamente. Não houve ajuste para obter 50% de vitórias. Os pesos do computador permaneceram em 70% / 25% / 5% e a incerteza em 0,15 em todos os cenários. Com 5.000 partidas por perfil, a margem amostral aproximada máxima é de 1,4 ponto percentual (95%); isso não mede a incerteza dos modelos de jogador.\n\n## O que foi modelado\n\n- Sem conhecimento: escolha uniforme entre as cartas disponíveis.\n- Básico: estimativas mais imprecisas (incerteza 0,35); pesos 55% / 30% / 15%.\n- Intermediário: mesmas estimativas e pesos do computador, com sorteios independentes.\n- Elevado: estimativas mais precisas, ainda incertas (0,06); pesos 90% / 9% / 1%.\n\nEsses perfis representam conhecimento prévio sobre os próprios países. O simulador resolve somente os IDs da mão ativa do jogador em um catálogo para modelar essa memória. A interface real continua sem números antes da revelação. Nenhum perfil consulta as cartas adversárias, a decisão do computador ou as regras futuras. Os resultados são comparações entre modelos e não previsões de vitória de jogadores reais.\n\nCada perfil usou as mesmas sementes ${report.firstSeed} a ${report.lastSeed}, com um gerador independente para as escolhas do jogador. Foram ${results[0].uniquePlayerDecks} baralhos próprios distintos e ${results[0].uniqueSchedules} sequências distintas por perfil. A decisão do computador foi definida no início de cada rodada, antes da seleção adversária.\n\n## Incerteza da avaliação\n\nEm ${audit.hands.toLocaleString('pt-BR')} mãos independentes, a carta estimada como melhor não era a melhor pelo valor real em ${audit.estimatedBestNotTrueBest} casos (${pct(100*audit.estimatedBestNotTrueBest/audit.hands)}). Além desse erro, o sorteio pode escolher a segunda ou a terceira estimativa. Os pesos se referem à ordem estimada, não à ordem real nem à chance de vencer a rodada. A avaliação usa arredondamento e ruído apenas sobre os próprios valores, sem percentis, distribuições do catálogo ou cálculo exato de probabilidade de vitória.\n\n## Reproduzir\n\nExecute \`node scripts/simulate-balance.mjs\`. Detalhes e contagens estão em \`qa/balance-results.json\`. O dataset SHA-256 é \`${report.datasetSha256}\`.\n`;
mkdirSync(new URL('../qa/',import.meta.url),{recursive:true});
writeFileSync(new URL('../qa/balance-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
writeFileSync(new URL('../qa/EQUILIBRIO.md',import.meta.url),markdown);
console.log(table.join('\n'));
console.log(`PASS: ${report.totalMatches} complete matches, ${report.totalRounds} rounds. Approximation audit: ${audit.estimatedBestNotTrueBest}/${audit.hands} top estimates differ from the true best.`);

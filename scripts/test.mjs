import assert from 'node:assert/strict';
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),engine=require('../projeto-demografia-ufmg/engine.js');
const modes=require('../projeto-demografia-ufmg/modes.js'),selection=require('../projeto-demografia-ufmg/selection.js');
const legacy=require('./fixtures/normal-engine-v1.cjs');
const load=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const dataset=JSON.parse(load('../projeto-demografia-ufmg/data/countries.json')),catalog=dataset.countries;
const byId=new Map(catalog.map(card=>[card.id,card]));
const previous=JSON.parse(load('fixtures/original-36.json'));
const registry=JSON.parse(load('fixtures/un-register.json'));
assert.equal(catalog.length,195);assert.equal(byId.size,195);assert.equal(catalog.length*engine.KEYS.length,1170);
for(const card of previous.countries)assert.deepEqual(byId.get(card.id),card,'All previous 216 numeric values and identities must remain exact');
assert.equal(dataset.metadata.year,2024);assert.equal(dataset.metadata.status,'projection');
assert.equal(dataset.metadata.sourceSha256,'286ac36bb1415e2e1ade03acfef0a29f0e4c087e2f78e38c48f50c5df89082bc');
assert.deepEqual(dataset.metadata.coverage,{requestedMembers:193,requestedObservers:2,includedMembers:193,includedObservers:2,countries:195,values:1170,excluded:[]});
assert.equal(registry.filter(row=>row.status==='member').length,193);
assert.deepEqual(registry.filter(row=>row.status==='observer').map(row=>row.id).sort(),['PSE','VAT']);
assert.ok(registry.every(row=>row.complete&&row.missing.length===0&&byId.has(row.id)));
for(const card of catalog){
  for(const key of engine.KEYS)assert.ok(Number.isFinite(card[key]),`${card.id}: ${key}`);
  assert.ok(card.population>0&&Number.isInteger(card.population));assert.match(card.flag,/^[a-z]{2}$/);
  const flag=load(`../projeto-demografia-ufmg/assets/flags/${card.flag}.svg`);
  assert.match(flag,/<svg\b/);assert.doesNotMatch(flag,/<script\b|onload\s*=|<foreignObject\b/i);
}
const fromJS=load('../projeto-demografia-ufmg/data/countries.js').split('window.DEMOGRAPHY_DATA = ')[1].trim().slice(0,-1);
assert.deepEqual(JSON.parse(fromJS),dataset);
function csv(text){
  const rows=[];let row=[],value='',quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(value);value='';}
    else if(c==='\n'&&!quoted){row.push(value.replace(/\r$/,''));rows.push(row);row=[];value='';}
    else value+=c;
  }
  const headers=rows.shift();return rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i]])));
}
for(const row of csv(load('../projeto-demografia-ufmg/data/countries.csv'))){
  const card=byId.get(row.id);for(const key of ['id','name','flag'])assert.equal(row[key],card[key]);
  for(const key of engine.KEYS)assert.equal(Number(row[key]),card[key]);
}
const sourceColumns=['TPopulation1July','LEx','TFR','IMR','CNMR','MedianAgePop'];
const sourceRows=csv(load('fixtures/wpp-2024-source-rows.csv'));assert.equal(sourceRows.length,195);
for(const row of sourceRows){
  assert.equal(row.Time,'2024');assert.equal(row.Variant,'Medium');
  engine.KEYS.forEach((key,index)=>assert.ok(Math.abs(Number(row[sourceColumns[index]])*(index===0?1000:1)-byId.get(row.id)[key])<1e-6));
  assert.equal(row.source,row.id==='TGO'?'interim-update':'main-medium');
}
assert.equal(byId.get('TGO').population,8406558);assert.equal(byId.get('TGO').fertility,4.121673);
assert.equal(modes.EASY_IDS.length,36);assert.equal(modes.KNOWN_IDS.length,30);assert.equal(modes.LESS_KNOWN_IDS.length,30);
assert.equal(new Set([...modes.KNOWN_IDS,...modes.LESS_KNOWN_IDS]).size,60);
assert.deepEqual(modes.KNOWN_IDS,modes.EASY_IDS.filter(id=>!['PER','CUB','PRK','SAU','THA','KEN'].includes(id)));
for(const [mode,count]of [['easy',36],['normal',60],['hard',195]])assert.equal(selection.pool(catalog,mode).length,count);
assert.deepEqual(selection.pool(catalog,'hard'),catalog);assert.equal(modes.MODES.hard.bankIds,null);
assert.ok(Object.values(modes.MODES).every(Object.isFrozen));
function seeded(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function schedule(rules){assert.equal(rules.length,12);for(const indicator of engine.KEYS)for(const objective of ['higher','lower'])assert.equal(rules.filter(rule=>rule.indicator===indicator&&rule.objective===objective).length,1);}
function privacy(view){
  for(const card of [...view.playerHand,...view.roundHand]){
    if(view.mode.visibleValues){for(const key of engine.KEYS)assert.equal(card[key],byId.get(card.id)[key]);}
    else {assert.ok(Object.keys(card).every(key=>['id','name','flag','status'].includes(key)));for(const key of engine.KEYS)assert.equal(card[key],undefined);}
    assert.equal(card.estimate,undefined);assert.equal(card.rarity,undefined);
  }

  for(const card of view.playerDeck){
    if(view.mode.fullDeckSelection){for(const key of engine.KEYS)assert.equal(card[key],byId.get(card.id)[key]);}
    else {assert.ok(Object.keys(card).every(key=>['id','name','flag','status'].includes(key)));for(const key of engine.KEYS)assert.equal(card[key],undefined);}
  }
  for(const key of ['computerHand','computerChoiceId','computerDeck','computerReserve','playerReserve','rounds','difficulty','estimates','random'])assert.equal(view[key],undefined,key);
}
const original=JSON.stringify(dataset),sampled={},runs=200;
for(const mode of Object.keys(modes.MODES)){
  const allSeen=new Set(),schedules=new Set();
  for(let seed=1;seed<=runs;seed++){
    const rng=seeded(seed);let randomCalls=0;
    const game=engine.createGame(catalog,{mode,random:()=>{randomCalls++;return rng();}});
    assert.deepEqual(Object.keys(game),[]);assert.ok(Object.isFrozen(game));
    const playerIds=engine.getView(game).playerDeck.map(card=>card.id);
    const used=new Set(),rules=[],computerIds=[];
    assert.equal(playerIds.length,12);assert.equal(new Set(playerIds).size,12);
    if(mode==='normal')assert.equal(playerIds.filter(id=>modes.KNOWN_IDS.includes(id)).length,6);
    for(let round=0;round<12;round++){
      const before=engine.getView(game);privacy(before);assert.equal(before.round,round);
      assert.equal(before.playerHand.length,mode==='easy'?12-round:Math.min(3,12-round));
      assert.equal(before.computerHandCount,Math.min(3,12-round));
      assert.equal(before.playerReserveCount,mode==='easy'?0:Math.max(0,9-round));
      assert.equal(before.computerReserveCount,Math.max(0,9-round));
      assert.equal(before.playerDeck.filter(card=>card.status==='discarded').length,round);
      assert.equal(engine.reveal(game),null);assert.equal(engine.next(game),false);
      const reserve=before.playerDeck.find(card=>card.status==='reserve');
      if(reserve)assert.equal(engine.selectCard(game,reserve.id),false);
      for(const id of used)assert.equal(engine.selectCard(game,id),false);
      assert.equal(engine.selectCard(game,'NOT-A-CARD'),false);
      const calls=randomCalls;
      for(const card of before.playerHand)assert.equal(engine.selectCard(game,card.id),true);
      const chosen=before.playerHand[(seed+round)%before.playerHand.length];engine.selectCard(game,chosen.id);
      const result=engine.reveal(game);assert.equal(randomCalls,calls,'No random draw or AI reconsideration after player input');
      assert.equal(result.playerCard.id,chosen.id);assert.deepEqual({indicator:result.indicator,objective:result.objective},before.rule);
      assert.ok(!playerIds.includes(result.computerCard.id));computerIds.push(result.computerCard.id);
      for(const card of [result.playerCard,result.computerCard]){assert.ok(!used.has(card.id));used.add(card.id);allSeen.add(card.id);assert.deepEqual(card,byId.get(card.id));assert.ok(Object.isFrozen(card));}
      assert.equal(result.winner,engine.compare(result.playerCard,result.computerCard,before.rule));
      const after=engine.getView(game);privacy(after);assert.equal(after.playerScore+after.computerScore+after.ties,round+1);
      assert.equal(after.playerDeck.filter(card=>card.status==='discarded').length,round+1);
      assert.equal(engine.selectCard(game,chosen.id),false);assert.equal(engine.reveal(game),null);
      rules.push(before.rule);assert.equal(engine.next(game),true);
    }
    schedule(rules);schedules.add(JSON.stringify(rules));assert.equal(used.size,24);
    if(mode==='normal')assert.equal(computerIds.filter(id=>modes.KNOWN_IDS.includes(id)).length,6);
    const end=engine.getView(game);privacy(end);assert.ok(end.finished);assert.equal(end.history.length,12);
    assert.equal(end.playerHand.length+end.computerHandCount+end.playerReserveCount+end.computerReserveCount,0);
    assert.equal(engine.next(game),false);assert.equal(engine.reveal(game),null);
  }
  assert.ok(schedules.size>1);assert.equal(allSeen.size,selection.pool(catalog,mode).length);sampled[mode]=allSeen.size;
}
// Independent deals read IDs only, never values or any strategic ranking.
const idOnly=catalog.map(card=>new Proxy({id:card.id},{get(target,key){assert.equal(key,'id');return target[key];}}));
for(const mode of Object.keys(modes.MODES))assert.equal(selection.deal(idOnly,mode,seeded(1)).player.length,12);
// Player choices and changes to ONLY the player's data cannot affect the AI.
for(const mode of Object.keys(modes.MODES))for(let seed=1;seed<=40;seed++){
  const a=engine.createGame(catalog,{mode,random:seeded(seed)});
  const playerIds=new Set(engine.getView(a).playerDeck.map(card=>card.id));
  const altered=catalog.map(card=>playerIds.has(card.id)?{...card,...Object.fromEntries(engine.KEYS.map(key=>[key,-1000*card[key]-12345]))}:card);
  const b=engine.createGame(altered,{mode,random:seeded(seed)});
  for(let round=0;round<12;round++){
    const va=engine.getView(a),vb=engine.getView(b);assert.deepEqual(va.rule,vb.rule);
    engine.selectCard(a,va.playerHand[0].id);for(const card of vb.playerHand)engine.selectCard(b,card.id);
    assert.equal(engine.reveal(a).computerCard.id,engine.reveal(b).computerCard.id,'AI used opponent values, choice or score');
    engine.next(a);engine.next(b);
  }
}
// Snapshot regression: exact legacy Normal estimator/decision in both new modes.
for(let seed=1;seed<=1000;seed++){
  const hand=engine.shuffle(catalog,seeded(seed)).slice(0,3),rule={indicator:engine.KEYS[seed%6],objective:seed%2?'higher':'lower'};
  const a=engine.estimateOwnHand(hand,rule,seeded(seed)),b=legacy.estimateOwnHand(hand,rule,seeded(seed));assert.deepEqual(a,b);
  assert.equal(engine.chooseComputerCard({hand:a,objective:rule.objective},seeded(seed)),legacy.chooseComputerCard({hand:b,objective:rule.objective},seeded(seed)));
}
assert.deepEqual(engine.DEFAULT_DIFFICULTY,{rankWeights:[.7,.25,.05],uncertainty:.15});
const guard=([70,71,75]).map((value,index)=>new Proxy({id:`OWN${index}`,lifeExpectancy:value},{get(target,key){assert.ok(['id','lifeExpectancy'].includes(key));return target[key];}}));
const estimates=engine.estimateOwnHand(guard,{indicator:'lifeExpectancy'},seeded(5));
const info=new Proxy({hand:estimates.map(card=>new Proxy(card,{get(target,key){assert.ok(['id','estimate'].includes(key));return target[key];}})),objective:'higher'},{get(target,key){assert.ok(['hand','objective'].includes(key));return target[key];}});
assert.ok(estimates.some(card=>card.id===engine.chooseComputerCard(info,seeded(2))));
assert.throws(()=>engine.chooseComputerCard({hand:[catalog[0]],objective:'higher'}));
assert.throws(()=>engine.chooseComputerCard({hand:estimates,objective:'higher',playerChoice:'OWN0'}));
const ranked=[{id:'BEST',estimate:30},{id:'SECOND',estimate:20},{id:'THIRD',estimate:10}],frequencies={BEST:0,SECOND:0,THIRD:0},rng=seeded(4312);
for(let i=0;i<30000;i++)frequencies[engine.chooseComputerCard({hand:ranked,objective:'higher'},rng)]++;
for(const [i,id]of ['BEST','SECOND','THIRD'].entries())assert.ok(Math.abs(frequencies[id]/30000-[.7,.25,.05][i])<.015);
const two={BEST:0,SECOND:0},twoRng=seeded(581);for(let i=0;i<20000;i++)two[engine.chooseComputerCard({hand:ranked.slice(0,2),objective:'higher'},twoRng)]++;
assert.ok(Math.abs(two.BEST/20000-.7/.95)<.015);
assert.equal(engine.chooseComputerCard({hand:[ranked[0]],objective:'lower'},()=>{throw Error('One card needs no RNG');}),'BEST');
for(const rankWeights of [[-1,1,1],[0,0,0],[NaN,1,1],[Infinity,1,1],[1,1],[Number.MAX_VALUE,Number.MAX_VALUE,0]])assert.throws(()=>engine.normalizeDifficulty({rankWeights,uncertainty:.15}));
for(const uncertainty of [-.1,1.1,NaN,Infinity])assert.throws(()=>engine.normalizeDifficulty({rankWeights:[70,25,5],uncertainty}));
assert.deepEqual(engine.normalizeDifficulty({rankWeights:[70,25,5],uncertainty:.15}).rankWeights,[.7,.25,.05]);assert.ok(Object.isFrozen(engine.DEFAULT_DIFFICULTY.rankWeights));
let inversions=0;
for(let seed=0;seed<100;seed++){const approx=engine.estimateOwnHand([{id:'A',lifeExpectancy:70},{id:'B',lifeExpectancy:70.1},{id:'C',lifeExpectancy:75}],{indicator:'lifeExpectancy'},seeded(seed));if(approx[0].estimate>approx[1].estimate)inversions++;}
assert.ok(inversions>0,'Approximation must sometimes invert close true ranks');
for(const mode of Object.keys(modes.MODES)){
  const mutable={rankWeights:[.7,.25,.05],uncertainty:.15};
  const a=engine.createGame(catalog,{mode,random:seeded(902),difficulty:mutable}),b=engine.createGame(catalog,{mode,random:seeded(902)});
  mutable.rankWeights.fill(0);mutable.uncertainty=0;
  for(let round=0;round<12;round++){for(const game of [a,b])engine.selectCard(game,engine.getView(game).playerHand[0].id);assert.equal(engine.reveal(a).computerCard.id,engine.reveal(b).computerCard.id);engine.next(a);engine.next(b);}
  const same=catalog.map(card=>({...card,...Object.fromEntries(engine.KEYS.map(key=>[key,1]))}));
  const tied=engine.createGame(same,{mode,random:seeded(77)}),rules=[];
  for(let round=0;round<12;round++){const view=engine.getView(tied);rules.push(view.rule);engine.selectCard(tied,view.playerHand[0].id);assert.equal(engine.reveal(tied).winner,'tie');engine.next(tied);}
  schedule(rules);assert.equal(engine.getView(tied).ties,12);assert.equal(engine.getView(tied).playerScore+engine.getView(tied).computerScore,0);
}
assert.equal(engine.compare({netMigration:-.3},{netMigration:-2},{indicator:'netMigration',objective:'higher'}),'player');
assert.equal(engine.compare({netMigration:-.3},{netMigration:-2},{indicator:'netMigration',objective:'lower'}),'computer');
assert.equal(engine.compare({fertility:1.501},{fertility:1.502},{indicator:'fertility',objective:'lower'}),'player');
assert.throws(()=>engine.createGame(catalog,{mode:'unknown'}));
assert.throws(()=>engine.createGame([...catalog,catalog[0]]));
assert.throws(()=>engine.createGame(catalog.map((card,i)=>i===0?{...card,fertility:null}:card)));
assert.equal(JSON.stringify(dataset),original);
for(const file of ['app.js','engine.js','styles.css','difficulty.js','modes.js','computer.js','selection.js'])assert.doesNotMatch(load(`../projeto-demografia-ufmg/${file}`),/rarit|raridad|\bComum\b|\bRara\b|Épica/i);
const html=load('../projeto-demografia-ufmg/index.html');for(const file of ['atlas','modes','indicators','rules','selection','difficulty','computer','engine','app'])assert.ok(html.includes(`${file}.js?v=20261023-atlas`));
const summary={fullGames:600,pairedPrivacyGames:240,legacyHands:1000,rankDraws:30000,frequencies,sampledPools:sampled,sourceRows:195,values:1170,previousValuesPreserved:216};
writeFileSync(new URL('../qa/test-results.json',import.meta.url),JSON.stringify(summary,null,2)+'\n');
console.log('PASS: 195 countries / 1170 verified source values; all previous 36 countries exact; 195 safe local flags; CSV/JS/JSON parity.');
console.log('PASS: 600 complete games in all modes; exact pools, Normal 6+6 each side, Easy all 12 accessible, 12 balanced rounds, 24 unique discards.');
console.log('PASS: 120 paired matches (240 games) isolate hidden opposing choices/values; no AI reconsideration after selection.');
console.log('PASS: 1000 legacy AI regressions, guarded inputs, real uncertainty, configurable 70/25/5, 2/1-card endgame, frozen settings.');
console.log('PASS: ties for every indicator and both objectives in all modes, signed migration and original numeric precision.');
console.log(JSON.stringify(summary));

await import("./test-render.mjs");
await import("./test-atlas.mjs");

import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const engine = require('../projeto-demografia-ufmg/engine.js');
const dataset = JSON.parse(readFileSync(new URL('../projeto-demografia-ufmg/data/countries.json', import.meta.url)));
const catalog = dataset.countries;
assert.equal(createHash('sha256').update(readFileSync(new URL('../projeto-demografia-ufmg/data/countries.json', import.meta.url))).digest('hex'), '3cd1d5ebb4b148e37d9d0b150b15529d4a89cb51c0e3242c9fbf32d7868aa9bb', 'All 216 values and metadata must remain byte-identical');
const originals = JSON.parse(readFileSync(new URL('fixtures/original-24.json', import.meta.url)));
const added = ['CAN','CHL','NOR','PRT','KOR','BGD','PAK','PHL','TUR','EGY','ETH','NZL'];
assert.equal(catalog.length, 36);
assert.deepEqual(catalog.slice(0, 24), originals, 'Every original country and all 144 values must remain exact');
assert.deepEqual(catalog.slice(24).map(card => card.id), added);
assert.equal(catalog.length * engine.KEYS.length, 216);
assert.equal(dataset.metadata.year, 2024);
assert.equal(dataset.metadata.status, 'projection');
assert.equal(dataset.metadata.sourceSha256, '286ac36bb1415e2e1ade03acfef0a29f0e4c087e2f78e38c48f50c5df89082bc');
for (const card of catalog) {
  for (const key of engine.KEYS) assert.ok(Number.isFinite(card[key]), `${card.id}: missing ${key}`);
  assert.ok(existsSync(new URL(`../projeto-demografia-ufmg/assets/flags/${card.flag}.svg`, import.meta.url)));
}
const jsonFromJS = readFileSync(new URL('../projeto-demografia-ufmg/data/countries.js', import.meta.url), 'utf8').split('window.DEMOGRAPHY_DATA = ')[1].trim().slice(0, -1);
assert.deepEqual(JSON.parse(jsonFromJS), dataset);
const originalDataset = JSON.stringify(dataset);
function seeded(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function assertSchedule(rules) {
  assert.equal(rules.length, 12);
  for (const indicator of engine.KEYS) for (const objective of ['higher','lower']) {
    assert.equal(rules.filter(rule => rule.indicator === indicator && rule.objective === objective).length, 1);
  }
}
function assertKeys(object, allowed) {
  assert.ok(Object.keys(object).every(key => allowed.includes(key)), `Forbidden field: ${Object.keys(object)}`);
  for (const key of engine.KEYS) assert.equal(object[key], undefined, `Hidden value ${key} leaked`);
  assert.equal(object.estimate, undefined);
  assert.equal(object.rarity, undefined);
}
function assertClues(view) {
  for (const card of [...view.playerHand, ...view.roundHand]) {
    assertKeys(card, ['id','name','flag']);
  }
  for (const card of view.playerDeck) assertKeys(card, ['id','name','flag','status']);
  for (const secret of ['computerHand','computerChoiceId','computerDeck','computerReserve','playerReserve','rounds','difficulty','estimates','random']) assert.equal(view[secret], undefined);
}

const sampled = new Set();
const schedules = new Set();
for (let run=1;run<=200;run++) {
  let randomCalls=0;
  const random=seeded(run);
  const game=engine.createGame(catalog,()=>{randomCalls++;return random();});
  assert.deepEqual(Object.keys(game), []);
  const playerDeck=engine.getView(game).playerDeck.map(card=>card.id);
  assert.equal(new Set(playerDeck).size,12);
  const used=new Set(); const rules=[];
  for(let round=0;round<12;round++) {
    const before=engine.getView(game); assertClues(before);
    assert.equal(before.round,round);
    assert.equal(before.playerHand.length,Math.min(3,12-round));
    assert.equal(before.computerHandCount,Math.min(3,12-round));
    assert.equal(before.playerReserveCount,Math.max(0,9-round));
    assert.equal(before.computerReserveCount,Math.max(0,9-round));
    assert.equal(before.playerDeck.filter(card=>card.status==='hand').length,before.playerHand.length);
    assert.equal(before.playerDeck.filter(card=>card.status==='reserve').length,before.playerReserveCount);
    assert.equal(before.playerDeck.filter(card=>card.status==='discarded').length,round);
    assert.deepEqual(before.playerDeck.map(card=>card.id),playerDeck);
    assert.equal(before.selectedCardId,null); assert.equal(before.revealed,false); assert.equal(before.result,null);
    assert.equal(before.history.length,round);
    assert.ok(before.history.every(result=>result.round<=round));
    assert.equal(engine.reveal(game),null); assert.equal(engine.next(game),false);
    for(const card of before.playerDeck.filter(card=>card.status!=='hand')) assert.equal(engine.selectCard(game,card.id),false);
    assert.equal(engine.selectCard(game,before.rule.indicator),false);
    assert.throws(()=>{before.playerHand[0].population=0;});
    assert.throws(()=>{before.rule.objective='higher';});
    const calls=randomCalls;
    for(const card of before.playerHand) {
      assert.equal(engine.selectCard(game,card.id),true);
      const changed=engine.getView(game); assertClues(changed);
      assert.equal(changed.result,null); assert.equal(changed.revealed,false);
    }
    const chosen=before.playerHand[run%before.playerHand.length];
    engine.selectCard(game,chosen.id);
    const result=engine.reveal(game);
    assert.equal(randomCalls,calls,'No AI reconsideration after seeing a player choice');
    assert.equal(result.playerCard.id,chosen.id);
    assert.equal(result.indicator,before.rule.indicator); assert.equal(result.objective,before.rule.objective);
    for(const card of [result.playerCard,result.computerCard]) {
      assert.ok(!used.has(card.id),'No card can be reused'); used.add(card.id); sampled.add(card.id);
      for(const key of engine.KEYS) assert.equal(card[key],catalog.find(source=>source.id===card.id)[key]);
    }
    assert.ok(!playerDeck.includes(result.computerCard.id),'Opponent cannot use a player card');
    const p=result.playerCard[result.indicator], c=result.computerCard[result.indicator];
    assert.equal(result.winner,p===c?'tie':((result.objective==='higher'?p>c:p<c)?'player':'computer'));
    const after=engine.getView(game); assertClues(after);
    assert.equal(after.playerScore+after.computerScore+after.ties,round+1);
    assert.equal(after.playerDeck.filter(card=>card.status==='discarded').length,round+1);
    assert.equal(after.playerHand.length,before.playerHand.length-1);
    assert.equal(after.computerHandCount,before.computerHandCount-1);
    assert.equal(engine.reveal(game),null); assert.equal(engine.selectCard(game,chosen.id),false);
    rules.push(before.rule); assert.equal(engine.next(game),true);
  }
  assertSchedule(rules); schedules.add(JSON.stringify(rules)); assert.equal(used.size,24);
  assert.equal(catalog.filter(card=>!used.has(card.id)).length,12);
  const end=engine.getView(game);assertClues(end); assert.equal(end.finished,true);
  assert.equal(end.playerDeck.filter(card=>card.status==='discarded').length,12);
  assert.equal(end.playerHand.length+end.computerHandCount+end.playerReserveCount+end.computerReserveCount,0);
  assert.equal(engine.next(game),false); assert.equal(engine.reveal(game),null);
}
assert.equal(sampled.size,36,'Sampling across matches includes all 36 countries');
assert.ok(schedules.size>1);

// Same seed + different player selections cannot alter precommitted AI decisions.
for(let seed=1;seed<=40;seed++) {
  const a=engine.createGame(catalog,seeded(seed)), b=engine.createGame(catalog,seeded(seed));
  for(let round=0;round<12;round++) {
    const va=engine.getView(a), vb=engine.getView(b); assert.deepEqual(va.rule,vb.rule);
    engine.selectCard(a,va.playerHand[0].id);
    for(const card of vb.playerHand)engine.selectCard(b,card.id);
    const ra=engine.reveal(a), rb=engine.reveal(b);
    assert.equal(ra.computerCard.id,rb.computerCard.id);
    engine.next(a);engine.next(b);
  }
}
// Alter only the opponent's hidden numeric values. The computer's whole sequence
// must remain identical despite different opponent values, selections and scores.
for(let seed=1;seed<=40;seed++) {
  const a=engine.createGame(catalog,seeded(seed));
  const ownIds=new Set(engine.getView(a).playerDeck.map(card=>card.id));
  const altered=catalog.map(card=>ownIds.has(card.id)?{...card,...Object.fromEntries(engine.KEYS.map(key=>[key,-1000*card[key]-12345]))}:card);
  const b=engine.createGame(altered,seeded(seed));
  for(let round=0;round<12;round++) {
    const va=engine.getView(a),vb=engine.getView(b);
    assert.deepEqual(va.rule,vb.rule);
    engine.selectCard(a,va.playerHand[0].id);
    engine.selectCard(b,vb.playerHand[vb.playerHand.length-1].id);
    assert.equal(engine.reveal(a).computerCard.id,engine.reveal(b).computerCard.id,'AI accessed opponent data');
    engine.next(a);engine.next(b);
  }
}

// Approximation can read ONLY its own IDs and the current numeric indicator.
const guardedOwnHand=[70,71,75].map((value,index)=>new Proxy({id:`OWN${index}`,lifeExpectancy:value},{get(target,key){
  assert.ok(['id','lifeExpectancy'].includes(key),`Forbidden estimate read: ${String(key)}`);return target[key];
}}));
const estimates=engine.estimateOwnHand(guardedOwnHand,{indicator:'lifeExpectancy'},seeded(5));
assert.ok(estimates.every(card=>Object.keys(card).join(',')==='id,estimate'));
const guardedEstimates=estimates.map(card=>new Proxy(card,{get(target,key){
  assert.ok(['id','estimate'].includes(key),`Forbidden decision read: ${String(key)}`);return target[key];
}}));
const allowedInfo=new Proxy({hand:guardedEstimates,objective:'higher'},{get(target,key){
  assert.ok(['hand','objective'].includes(key),`Forbidden decision information: ${String(key)}`);return target[key];
}});
assert.ok(estimates.some(card=>card.id===engine.chooseComputerCard(allowedInfo,seeded(2))));
assert.throws(()=>engine.chooseComputerCard({hand:[catalog[0]],objective:'higher'}));
assert.throws(()=>engine.chooseComputerCard({hand:estimates,objective:'higher',playerChoice:'OWN0'}));

const ranked=[{id:'BEST',estimate:30},{id:'SECOND',estimate:20},{id:'THIRD',estimate:10}];
const frequencies={BEST:0,SECOND:0,THIRD:0};
const draws=seeded(4312);
for(let i=0;i<30000;i++) frequencies[engine.chooseComputerCard({hand:ranked,objective:'higher'},draws)]++;
for(const [index,id] of ['BEST','SECOND','THIRD'].entries()) assert.ok(Math.abs(frequencies[id]/30000-[.70,.25,.05][index])<.015);
for(const objective of ['higher','lower']) for(let rank=0;rank<3;rank++) {
  const settings={rankWeights:[0,0,0],uncertainty:.15};settings.rankWeights[rank]=1;
  const expected=(objective==='higher'?ranked:[...ranked].reverse())[rank].id;
  assert.equal(engine.chooseComputerCard({hand:ranked,objective},seeded(rank+1),settings),expected);
}
const twoCounts={BEST:0,SECOND:0},twoRandom=seeded(581);
for(let i=0;i<20000;i++) twoCounts[engine.chooseComputerCard({hand:ranked.slice(0,2),objective:'higher'},twoRandom)]++;
assert.ok(Math.abs(twoCounts.BEST/20000-.70/.95)<.015);
assert.equal(engine.chooseComputerCard({hand:[ranked[0]],objective:'lower'},()=>{throw Error('No random draw needed with one card');}),'BEST');
assert.ok(['BEST','SECOND'].includes(engine.chooseComputerCard({hand:ranked.slice(0,2),objective:'higher'},seeded(2),{rankWeights:[0,0,1],uncertainty:0})));
for(const rankWeights of [[-1,1,1],[0,0,0],[NaN,1,1],[Infinity,1,1],[1,1],[Number.MAX_VALUE,Number.MAX_VALUE,0]]) assert.throws(()=>engine.normalizeDifficulty({rankWeights,uncertainty:.15}));
for(const uncertainty of [-.1,1.1,NaN,Infinity]) assert.throws(()=>engine.normalizeDifficulty({rankWeights:[70,25,5],uncertainty}));
assert.deepEqual(engine.normalizeDifficulty({rankWeights:[70,25,5],uncertainty:.15}).rankWeights,[.7,.25,.05]);
assert.ok(Object.isFrozen(engine.DEFAULT_DIFFICULTY.rankWeights));

// Nearby true values sometimes reverse in the estimated order, even before the
// weighted rank draw. No exact percentiles or population-wide rankings are used.
let inverted=false,coarse=false;
for(let seed=0;seed<100;seed++) {
  const hand=[{id:'A',lifeExpectancy:70},{id:'B',lifeExpectancy:70.1},{id:'C',lifeExpectancy:75}];
  const approximation=engine.estimateOwnHand(hand,{indicator:'lifeExpectancy'},seeded(seed));
  inverted ||= approximation[0].estimate>approximation[1].estimate;
  coarse ||= approximation.some((card,i)=>card.estimate!==hand[i].lifeExpectancy);
}
assert.ok(inverted&&coarse,'Estimates must contain real uncertainty');
const changedSettings={rankWeights:[.7,.25,.05],uncertainty:.15};
const fixedA=engine.createGame(catalog,seeded(902),changedSettings);
const fixedB=engine.createGame(catalog,seeded(902));
changedSettings.rankWeights.fill(0);changedSettings.uncertainty=0;
for(let round=0;round<12;round++) {
  for(const game of [fixedA,fixedB])engine.selectCard(game,engine.getView(game).playerHand[0].id);
  assert.equal(engine.reveal(fixedA).computerCard.id,engine.reveal(fixedB).computerCard.id,'In-progress settings must be copied');
  engine.next(fixedA);engine.next(fixedB);
}
// Strategy settings cannot change initial cards or the pre-shuffled schedule.
const normalGame=engine.createGame(catalog,seeded(901));
const alternativeGame=engine.createGame(catalog,seeded(901),{rankWeights:[.1,.1,.8],uncertainty:.6});
assert.deepEqual(engine.getView(normalGame).playerDeck,engine.getView(alternativeGame).playerDeck);
for(let round=0;round<12;round++) {
  assert.deepEqual(engine.getView(normalGame).rule,engine.getView(alternativeGame).rule);
  for(const game of [normalGame,alternativeGame]) {
    engine.selectCard(game,engine.getView(game).playerHand[0].id);engine.reveal(game);engine.next(game);
  }
}

const allTied=catalog.map(card=>({...card,...Object.fromEntries(engine.KEYS.map(key=>[key,1]))}));
const tied=engine.createGame(allTied,seeded(77));
for(let round=0;round<12;round++){engine.selectCard(tied,engine.getView(tied).playerHand[0].id);assert.equal(engine.reveal(tied).winner,'tie');engine.next(tied);}
assert.equal(engine.getView(tied).ties,12);assert.equal(engine.getView(tied).playerScore+engine.getView(tied).computerScore,0);
assert.throws(()=>engine.createGame(catalog.slice(0,24)));
assert.throws(()=>engine.createGame(catalog.map((card,i)=>i===0?{...card,fertility:null}:card)));
assert.equal(JSON.stringify(dataset),originalDataset);
for(const file of ['app.js','engine.js','styles.css','difficulty.js']) assert.doesNotMatch(readFileSync(new URL(`../projeto-demografia-ufmg/${file}`,import.meta.url),'utf8'),/rarit|raridad|\bComum\b|\bRara\b|Épica/i);
console.log('PASS: unchanged 36-country / 216-value dataset, original 144 values, 36 local flags, JSON/JS consistency.');
console.log('PASS: 200 full games, masked identity-only hands, legal selection, reserves, balanced rounds, scoring, ties and completion.');
console.log('PASS: 80 paired full games isolate hidden opposing choices and values; computer choice committed before player input.');
console.log('PASS: guarded own-hand estimates, genuine rank uncertainty, configurable 70/25/5 sampling (30,000 draws), 2/1-card endgame.');
console.log('PASS: frozen match settings, independent pre-shuffled rules, no rarity implementation or labels in active site.');
console.log('Observed rank frequencies:',JSON.stringify(frequencies));

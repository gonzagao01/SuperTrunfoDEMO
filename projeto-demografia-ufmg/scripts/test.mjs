import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const engine = require('../engine.js');
const dataset = JSON.parse(readFileSync(new URL('../data/countries.json', import.meta.url)));
const catalog = dataset.countries;
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
  assert.ok(existsSync(new URL(`../assets/flags/${card.flag}.svg`, import.meta.url)));
}
const jsonFromJS = readFileSync(new URL('../data/countries.js', import.meta.url), 'utf8').split('window.DEMOGRAPHY_DATA = ')[1].trim().slice(0, -1);
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
}
function assertClues(view) {
  for (const card of [...view.playerHand, ...view.roundHand]) {
    assertKeys(card, ['id','name','flag','rarity']);
    assert.ok(engine.RARITIES.includes(card.rarity));
  }
  for (const card of view.playerDeck) assertKeys(card, ['id','name','flag','status']);
  for (const secret of ['computerHand','computerChoiceId','computerDeck','computerReserve','playerReserve','rounds','rarities','random']) assert.equal(view[secret], undefined);
}

// Exact nominal buckets on distinct data, and symmetric classification of both tails.
const distinct = catalog.map((card, index) => ({...card, ...Object.fromEntries(engine.KEYS.map(key => [key, index + 1]))}));
const nominal = engine.computeRarities(distinct);
for (const key of engine.KEYS) {
  const counts = Object.fromEntries(engine.RARITIES.map(label => [label, distinct.filter(card => nominal[card.id][key] === label).length]));
  assert.deepEqual(counts, {Comum:18, Rara:14, 'Épica':4});
  for (const index of [0,1,34,35]) assert.equal(nominal[distinct[index].id][key], 'Épica');
}
assert.deepEqual(engine.computeRarities([...distinct].reverse()), nominal, 'Catalog order cannot influence rarity');
const reversedValues = catalog.map(card => ({...card, ...Object.fromEntries(engine.KEYS.map(key => [key, -card[key]]))}));
const realRarities = engine.computeRarities(catalog);
assert.deepEqual(engine.computeRarities(reversedValues), realRarities, 'Rarity must be symmetric and cannot signal high versus low');
assert.ok(catalog.some(card => new Set(Object.values(realRarities[card.id])).size > 1), 'Rarity is contextual, not a permanent country category');
const tiedBoundary = distinct.map((card, index) => ({...card, ...Object.fromEntries(engine.KEYS.map(key => [key, index < 4 ? 1 : index + 1]))}));
const boundary = engine.computeRarities(tiedBoundary);
for (const key of engine.KEYS) {
  for (let i=0;i<4;i++) assert.equal(boundary[tiedBoundary[i].id][key], 'Épica');
  assert.equal(tiedBoundary.filter(card => boundary[card.id][key] === 'Épica').length, 6, 'Boundary adapts to preserve equal values');
}
const allTied = catalog.map(card => ({...card, ...Object.fromEntries(engine.KEYS.map(key => [key, 1]))}));
assert.ok(Object.values(engine.computeRarities(allTied)).every(classes => Object.values(classes).every(label => label === 'Comum')));
for (const key of engine.KEYS) for (const a of catalog) for (const b of catalog) {
  if (a[key] === b[key]) assert.equal(realRarities[a.id][key], realRarities[b.id][key]);
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
      assert.equal(card.rarity,realRarities[card.id][before.rule.indicator]);
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
      assert.equal(card.rarity,realRarities[card.id][result.indicator]);
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
// Reverse ALL hidden values but preserve identities and symmetric rarities.
// A numeric strategy would reverse its preference. This strategy must stay identical.
for(let seed=1;seed<=20;seed++) {
  const a=engine.createGame(catalog,seeded(seed)), b=engine.createGame(reversedValues,seeded(seed));
  for(let round=0;round<12;round++) {
    const va=engine.getView(a), vb=engine.getView(b);
    assert.deepEqual(va.playerHand,vb.playerHand);
    engine.selectCard(a,va.playerHand[0].id);engine.selectCard(b,vb.playerHand[0].id);
    assert.equal(engine.reveal(a).computerCard.id,engine.reveal(b).computerCard.id,'AI consulted hidden numeric values');
    engine.next(a);engine.next(b);
  }
}

// A guarded clue object throws if the decision tries to read numeric values.
const hand=['Comum','Rara','Épica'].map((rarity,index)=>new Proxy({id:`CLUE${index}`,name:'País',flag:'xx',rarity},{get(target,key){
  assert.ok(['id','name','flag','rarity'].includes(key),`Forbidden decision read: ${String(key)}`);return target[key];
}}));
const information=new Proxy({hand},{get(target,key){assert.equal(key,'hand','Decision read outside current visible clues');return target[key];}});
const decisions=new Set();
for(let seed=1;seed<=100;seed++)decisions.add(engine.chooseComputerCard(information,seeded(seed)));
assert.equal(decisions.size,3,'No rarity is permanently preferred or excluded');
assert.throws(()=>engine.chooseComputerCard({hand:[{...catalog[0],rarity:'Épica'}]}),'Raw numeric card input must be rejected');
assert.equal(engine.chooseComputerCard({hand:[hand[0]]},()=>{throw Error('No random draw with only one card');}),'CLUE0');
const tied=engine.createGame(allTied,seeded(77));
for(let round=0;round<12;round++){engine.selectCard(tied,engine.getView(tied).playerHand[0].id);assert.equal(engine.reveal(tied).winner,'tie');engine.next(tied);}
assert.equal(engine.getView(tied).ties,12); assert.equal(engine.getView(tied).playerScore+engine.getView(tied).computerScore,0);
assert.throws(()=>engine.createGame(catalog.slice(0,24)));
assert.throws(()=>engine.createGame(catalog.map((card,i)=>i===0?{...card,fertility:null}:card)));
assert.equal(JSON.stringify(dataset),originalDataset);
console.log('PASS: 36 countries, 216 values, original 144 preserved, 36 local flags; contextual 18/14/4 rarity, symmetric tails, ties and all-equal data.');
console.log('PASS: 200 complete games, random 24-of-36, 12-card decks, masked hands/reserves, states, replenishment, 24 discards, balanced rules, scores and ties.');
console.log('PASS: 40 paired games with different player choices; 20 paired games with reversed hidden values; AI receives only permitted clues, never numeric own-card values.');

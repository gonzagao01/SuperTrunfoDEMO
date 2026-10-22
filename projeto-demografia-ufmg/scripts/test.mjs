import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const engine = require('../engine.js');
const dataset = JSON.parse(readFileSync(new URL('../data/countries.json', import.meta.url)));
const deck = dataset.countries;
const expected = ['BRA','RUS','CHN','IND','JPN','USA','ESP','ERI','YEM','AUS','MEX','NGA','KEN','ARG','HTI','DEU','IDN','AFG','FRA','KGZ','MLI','MWI','ZAF','ISL'];
assert.deepEqual(deck.map(card => card.id), expected);
assert.equal(dataset.metadata.year, 2024);
assert.equal(dataset.metadata.status, 'projection');
assert.equal(dataset.metadata.variant, 'Medium');
for (const card of deck) {
  for (const key of engine.KEYS) assert.ok(Number.isFinite(card[key]), `${card.id} ${key}`);
  assert.ok(existsSync(new URL(`../assets/flags/${card.flag}.svg`, import.meta.url)));
}
const jsonFromJS = readFileSync(new URL('../data/countries.js', import.meta.url), 'utf8').split('window.DEMOGRAPHY_DATA = ')[1].trim().slice(0, -1);
assert.deepEqual(JSON.parse(jsonFromJS), dataset);
assert.equal(deck.find(card => card.id === 'BRA').population, 211998574);
assert.equal(deck.find(card => card.id === 'BRA').netMigration, -1.064);
assert.equal(deck.find(card => card.id === 'BRA').medianAge, 34.3821);

function seeded(seed) {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function assertSchedule(rounds) {
  assert.equal(rounds.length, 12);
  for (const indicator of engine.KEYS) {
    assert.equal(rounds.filter(rule => rule.indicator === indicator).length, 2);
    for (const objective of ['higher', 'lower']) {
      assert.equal(rounds.filter(rule => rule.indicator === indicator && rule.objective === objective).length, 1);
    }
  }
}
const originalDataset = JSON.stringify(dataset);
const schedules = new Set();
const signedComparisons = new Set();
for (let run = 1; run <= 200; run++) {
  let randomCalls = 0;
  const rng = seeded(run);
  const game = engine.createGame(deck, () => { randomCalls++; return rng(); });
  assert.deepEqual(Object.keys(game), [], 'Game handle must expose no private state');
  const played = new Set();
  const playerCards = new Set();
  const computerCards = new Set();
  const rules = [];
  for (let round = 0; round < 12; round++) {
    const before = engine.getView(game);
    assert.equal(before.round, round);
    assert.equal(before.playerHand.length, Math.min(3, 12 - round));
    assert.equal(before.computerHandCount, Math.min(3, 12 - round));
    assert.equal(before.playerReserveCount, Math.max(0, 9 - round));
    assert.equal(before.computerReserveCount, Math.max(0, 9 - round));
    assert.equal(before.playerHand.length + before.computerHandCount + before.playerReserveCount + before.computerReserveCount, 24 - 2 * round);
    assert.equal(before.selectedCardId, null);
    assert.equal(before.revealed, false);
    assert.equal(before.result, null);
    assert.equal(before.history.length, round);
    for (const secret of ['computerHand', 'computerChoiceId', 'computerReserve', 'playerReserve', 'rounds', 'random']) assert.equal(before[secret], undefined);
    assert.ok(before.history.every(result => result.round <= round), 'Only past revealed cards are public');
    assert.throws(() => before.playerHand.push(deck[0]));
    assert.throws(() => { before.playerHand[0].population = 0; });
    assert.throws(() => { before.rule.objective = 'higher'; });
    assert.equal(engine.reveal(game), null, 'Cannot reveal without a player choice');
    assert.equal(engine.next(game), false, 'Cannot skip an unrevealed round');
    assert.equal(engine.selectCard(game, before.rule.indicator), false, 'Indicators are not selectable');
    assert.equal(engine.selectCard(game, 'NOT_A_CARD'), false);
    for (const discarded of played) assert.equal(engine.selectCard(game, discarded), false);
    const callsBeforeSelection = randomCalls;
    for (const candidate of before.playerHand) {
      assert.ok(!played.has(candidate.id));
      assert.equal(engine.selectCard(game, candidate.id), true);
      const changed = engine.getView(game);
      assert.equal(changed.selectedCardId, candidate.id);
      assert.deepEqual(changed.playerHand, before.playerHand);
      assert.equal(changed.rule, before.rule);
      assert.equal(changed.revealed, false);
      assert.equal(changed.result, null);
    }
    const chosen = before.playerHand[run % before.playerHand.length];
    engine.selectCard(game, chosen.id);
    const result = engine.reveal(game);
    assert.equal(randomCalls, callsBeforeSelection, 'AI cannot reconsider during player selection or confirmation');
    assert.equal(result.playerCard.id, chosen.id);
    assert.equal(result.indicator, before.rule.indicator);
    assert.equal(result.objective, before.rule.objective);
    const player = result.playerCard[result.indicator];
    const computer = result.computerCard[result.indicator];
    const expectedWinner = player === computer ? 'tie' : ((result.objective === 'higher' ? player > computer : player < computer) ? 'player' : 'computer');
    assert.equal(result.winner, expectedWinner);
    if (result.indicator === 'netMigration' && player !== computer && (player < 0 || computer < 0)) signedComparisons.add(result.objective);
    for (const card of [result.playerCard, result.computerCard]) {
      assert.ok(!played.has(card.id), 'A discarded card cannot be played twice');
      played.add(card.id);
    }
    assert.ok(!before.playerHand.some(card => card.id === result.computerCard.id), 'The opposing card cannot come from the player hand');
    playerCards.add(result.playerCard.id);
    computerCards.add(result.computerCard.id);
    rules.push(before.rule);
    const after = engine.getView(game);
    assert.equal(after.playerScore + after.computerScore + after.ties, round + 1);
    assert.equal(after.playerHand.length, before.playerHand.length - 1);
    assert.equal(after.computerHandCount, before.computerHandCount - 1);
    assert.equal(after.history.length, round + 1);
    assert.equal(after.roundHand.length, before.playerHand.length, 'Keep the public round view stable until next');
    assert.equal(engine.reveal(game), null, 'Repeated confirmation cannot award another point');
    assert.equal(engine.selectCard(game, chosen.id), false);
    assert.equal(engine.next(game), true);
  }
  assertSchedule(rules);
  schedules.add(JSON.stringify(rules));
  assert.equal(played.size, 24);
  assert.equal(playerCards.size, 12);
  assert.equal(computerCards.size, 12);
  assert.ok([...playerCards].every(id => !computerCards.has(id)));
  const end = engine.getView(game);
  assert.equal(end.finished, true);
  assert.equal(end.rule, null);
  assert.equal(end.playerHand.length + end.computerHandCount + end.playerReserveCount + end.computerReserveCount, 0);
  assert.equal(engine.next(game), false);
  assert.equal(engine.reveal(game), null);
}
assert.ok(schedules.size > 1, 'The balanced schedule must actually be shuffled');
assert.deepEqual([...signedComparisons].sort(), ['higher', 'lower']);

// Counterfactual full matches: same deal/randomness but different player cards.
// Every AI commitment and every rule must stay identical, across all 12 rounds.
for (let seed = 1; seed <= 40; seed++) {
  const a = engine.createGame(deck, seeded(seed));
  const b = engine.createGame(deck, seeded(seed));
  for (let round = 0; round < 12; round++) {
    const va = engine.getView(a);
    const vb = engine.getView(b);
    assert.deepEqual(va.rule, vb.rule);
    engine.selectCard(a, va.playerHand[0].id);
    for (const card of vb.playerHand) engine.selectCard(b, card.id);
    engine.selectCard(b, vb.playerHand[vb.playerHand.length - 1].id);
    const ra = engine.reveal(a);
    const rb = engine.reveal(b);
    assert.equal(ra.computerCard.id, rb.computerCard.id, 'AI choice must not depend on hidden player selections');
    assert.deepEqual(ra.indicator, rb.indicator);
    assert.deepEqual(ra.objective, rb.objective);
    engine.next(a);
    engine.next(b);
  }
}

// Strategy can read only own card IDs, the current value and the current rule.
const own = [-8, -2, 4].map((value, index) => new Proxy({ id: `OWN${index}`, netMigration: value }, {
  get(target, key) {
    assert.ok(['id', 'netMigration'].includes(key), `Unexpected information read: ${String(key)}`);
    return target[key];
  },
}));
const script = numbers => { let i = 0; return () => numbers[i++] ?? 0; };
assert.equal(engine.chooseComputerCard(own, {indicator: 'netMigration', objective: 'higher'}, script([.99, .99, .1])), 'OWN2');
assert.equal(engine.chooseComputerCard(own, {indicator: 'netMigration', objective: 'lower'}, script([.99, .99, .1])), 'OWN0');
assert.notEqual(engine.chooseComputerCard(own, {indicator: 'netMigration', objective: 'higher'}, script([.99, .99, .9, 0])), 'OWN2', 'Strategy must sometimes use a non-optimal card');
assert.equal(engine.chooseComputerCard([own[0]], {indicator: 'netMigration', objective: 'higher'}, () => { throw Error('No randomness needed with one card'); }), 'OWN0');

// A tie is still a discarded pair and never awards points.
const tiedDeck = deck.map(card => Object.fromEntries(Object.entries(card).map(([key, value]) => [key, engine.KEYS.includes(key) ? 1 : value])));
const tied = engine.createGame(tiedDeck, seeded(50));
for (let round = 0; round < 12; round++) {
  engine.selectCard(tied, engine.getView(tied).playerHand[0].id);
  assert.equal(engine.reveal(tied).winner, 'tie');
  engine.next(tied);
}
assert.equal(engine.getView(tied).playerScore, 0);
assert.equal(engine.getView(tied).computerScore, 0);
assert.equal(engine.getView(tied).ties, 12);
assert.throws(() => engine.createGame(deck.slice(0, 23)));
assert.throws(() => engine.createGame(deck.map((card, i) => i === 0 ? {...card, fertility: null} : card)));
assert.equal(JSON.stringify(dataset), originalDataset, 'Gameplay must not modify the dataset');
console.log('PASS: 200 complete matches; each indicator exactly once per objective; 3-card hands, replenishment, 24 discards, scoring, signed migration and ties.');
console.log('PASS: 40 pairs of counterfactual complete matches; identical AI choices with different hidden player selections; no reconsideration, private-state exposure or dataset changes; imperfect own-hand strategy.');

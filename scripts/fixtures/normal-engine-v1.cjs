(function (root) {
  'use strict';
  const KEYS = Object.freeze(['population', 'lifeExpectancy', 'fertility', 'infantMortality', 'netMigration', 'medianAge']);
  const DEFAULT_DIFFICULTY = typeof module !== 'undefined' && module.exports ? require('./difficulty.js') : root.DEMOGRAPHY_DIFFICULTY;
  const games = new WeakMap();
  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function createRounds(random = Math.random) {
    return Object.freeze(shuffle(KEYS.flatMap(indicator => [
      Object.freeze({ indicator, objective: 'higher' }),
      Object.freeze({ indicator, objective: 'lower' }),
    ]), random));
  }
  function normalizeDifficulty(settings = DEFAULT_DIFFICULTY) {
    const weights = settings.rankWeights;
    if (!Array.isArray(weights) || weights.length !== 3 || weights.some(weight => !Number.isFinite(weight) || weight < 0)) throw new Error('Defina três pesos não negativos, com soma positiva.');
    const sum = weights.reduce((a, b) => a + b, 0);
    if (!Number.isFinite(sum) || sum <= 0) throw new Error('A soma dos pesos deve ser finita e positiva.');
    if (!Number.isFinite(settings.uncertainty) || settings.uncertainty < 0 || settings.uncertainty > 1) throw new Error('A incerteza deve estar entre 0 e 1.');
    return Object.freeze({ rankWeights: Object.freeze(weights.map(weight => weight / sum)), uncertainty: settings.uncertainty });
  }
  // AI estimation reads numeric values ONLY from the computer's own hand.
  // Coarse rounding plus bounded noise gives uncertain estimates; no catalog,
  // opposing card, prior distribution or exact win probability is consulted.
  function estimateOwnHand(hand, rule, random = Math.random, settings = DEFAULT_DIFFICULTY) {
    const difficulty = normalizeDifficulty(settings);
    if (!hand.length || hand.length > 3 || !KEYS.includes(rule.indicator)) throw new Error('Mão ou indicador inválido.');
    if (hand.length === 1) return Object.freeze([Object.freeze({ id: hand[0].id, estimate: 0 })]);
    const rawValues = hand.map(card => card[rule.indicator]);
    if (rawValues.some(value => !Number.isFinite(value))) throw new Error('Valor ausente na própria mão.');
    // Population spans orders of magnitude: estimate on a logarithmic scale so
    // one very large country does not overwhelm all differences among the others.
    const values = rule.indicator === 'population'
      ? rawValues.map(value => Math.sign(value) * Math.log1p(Math.abs(value)))
      : rawValues;
    const span = Math.max(...values) - Math.min(...values);
    const magnitude = Math.max(...values.map(Math.abs));
    const scale = Math.max(span, magnitude * .1) || 1;
    const step = scale * .1;
    return Object.freeze(hand.map((card, index) => Object.freeze({
      id: card.id,
      estimate: Math.round(values[index] / step) * step + (random() * 2 - 1) * difficulty.uncertainty * scale,
    })));
  }
  // The decision receives uncertain own-card estimates and the public objective.
  // Opposing information and exact numeric card values are absent from its input.
  function chooseComputerCard(information, random = Math.random, settings = DEFAULT_DIFFICULTY) {
    const difficulty = normalizeDifficulty(settings);
    const hand = information.hand;
    const objective = information.objective;
    if (Object.keys(information).some(key => !['hand', 'objective'].includes(key)) || !hand.length || hand.length > 3 || !['higher', 'lower'].includes(objective) || hand.some(card => Object.keys(card).some(key => !['id', 'estimate'].includes(key)) || !Number.isFinite(card.estimate))) throw new Error('A decisão deve receber apenas estimativas próprias e o objetivo.');
    if (hand.length === 1) return hand[0].id;
    const direction = objective === 'higher' ? -1 : 1;
    const ranked = shuffle(hand, random).sort((a, b) => direction * (a.estimate - b.estimate));
    let weights = difficulty.rankWeights.slice(0, ranked.length);
    let sum = weights.reduce((a, b) => a + b, 0);
    if (sum === 0) { weights = weights.map(() => 1); sum = weights.length; }
    const draw = random() * sum;
    let cumulative = 0;
    for (let i = 0; i < ranked.length; i++) {
      cumulative += weights[i];
      if (draw < cumulative) return ranked[i].id;
    }
    return ranked[ranked.length - 1].id;
  }
  function refill(hand, reserve) {
    while (hand.length < 3 && reserve.length) hand.push(reserve.shift());
  }
  function identity(card) {
    return { id: card.id, name: card.name, flag: card.flag };
  }
  function ownDeck(deck, hand, reserve) {
    const active = new Set(hand.map(card => card.id));
    const waiting = new Set(reserve.map(card => card.id));
    return Object.freeze(deck.map(card => Object.freeze({ ...identity(card), status: active.has(card.id) ? 'hand' : waiting.has(card.id) ? 'reserve' : 'discarded' })));
  }
  function prepareRound(state) {
    refill(state.playerHand, state.playerReserve);
    refill(state.computerHand, state.computerReserve);
    state.roundHand = Object.freeze([...state.playerHand]);
    const information = Object.freeze({
      hand: estimateOwnHand(Object.freeze([...state.computerHand]), state.rounds[state.round], state.random, state.difficulty),
      objective: state.rounds[state.round].objective,
    });
    // Commit before player input, with no path to the player's hand or choice.
    state.computerChoiceId = chooseComputerCard(information, state.random, state.difficulty);
  }
  function createGame(catalog, random = Math.random, settings = DEFAULT_DIFFICULTY) {
    if (catalog.length !== 36 || new Set(catalog.map(card => card.id)).size !== 36) throw new Error('O catálogo deve conter 36 países únicos.');
    for (const card of catalog) for (const key of KEYS) if (!Number.isFinite(card[key])) throw new Error('Indicador ausente no catálogo.');
    const difficulty = normalizeDifficulty(settings);
    const cards = shuffle(catalog.map(card => Object.freeze({ ...card })), random).slice(0, 24);
    const playerDeck = Object.freeze(cards.slice(0, 12));
    const computerDeck = Object.freeze(cards.slice(12));
    const state = {
      difficulty, rounds: createRounds(random), playerDeck, computerDeck,
      playerHand: [], computerHand: [], playerReserve: [...playerDeck], computerReserve: [...computerDeck],
      round: 0, playerScore: 0, computerScore: 0, ties: 0,
      selectedCardId: null, computerChoiceId: null, revealed: false,
      result: null, history: [], roundHand: Object.freeze([]), random,
    };
    const game = Object.freeze({});
    games.set(game, state);
    prepareRound(state);
    return game;
  }
  function getView(game) {
    const state = games.get(game);
    if (!state) throw new Error('Partida inválida.');
    const mask = card => Object.freeze(identity(card));
    return Object.freeze({
      round: state.round, rule: state.rounds[state.round] ?? null,
      playerHand: Object.freeze(state.round < 12 ? state.playerHand.map(mask) : []),
      roundHand: Object.freeze(state.round < 12 ? state.roundHand.map(mask) : []),
      playerDeck: ownDeck(state.playerDeck, state.playerHand, state.playerReserve),
      playerReserveCount: state.playerReserve.length,
      computerHandCount: state.computerHand.length, computerReserveCount: state.computerReserve.length,
      selectedCardId: state.selectedCardId, revealed: state.revealed,
      playerScore: state.playerScore, computerScore: state.computerScore, ties: state.ties,
      result: state.result, history: Object.freeze([...state.history]), finished: state.round === 12,
    });
  }
  function selectCard(game, cardId) {
    const state = games.get(game);
    if (!state || state.revealed || state.round >= 12 || !state.playerHand.some(card => card.id === cardId)) return false;
    state.selectedCardId = cardId;
    return true;
  }
  function reveal(game) {
    const state = games.get(game);
    if (!state || state.revealed || !state.selectedCardId || state.round >= 12) return null;
    const playerIndex = state.playerHand.findIndex(card => card.id === state.selectedCardId);
    const computerIndex = state.computerHand.findIndex(card => card.id === state.computerChoiceId);
    if (playerIndex < 0 || computerIndex < 0) return null;
    const rule = state.rounds[state.round];
    const playerCard = state.playerHand[playerIndex];
    const computerCard = state.computerHand[computerIndex];
    const difference = playerCard[rule.indicator] - computerCard[rule.indicator];
    const winner = difference === 0 ? 'tie' : ((rule.objective === 'higher' ? difference > 0 : difference < 0) ? 'player' : 'computer');
    if (winner === 'player') state.playerScore++;
    else if (winner === 'computer') state.computerScore++;
    else state.ties++;
    state.playerHand.splice(playerIndex, 1);
    state.computerHand.splice(computerIndex, 1);
    state.revealed = true;
    state.result = Object.freeze({ round: state.round + 1, ...rule, playerCard, computerCard, winner });
    state.history.push(state.result);
    return state.result;
  }
  function next(game) {
    const state = games.get(game);
    if (!state || !state.revealed || state.round >= 12) return false;
    state.round++;
    state.selectedCardId = null;
    state.computerChoiceId = null;
    state.revealed = false;
    state.result = null;
    state.roundHand = Object.freeze([]);
    if (state.round < 12) prepareRound(state);
    return true;
  }
  const api = Object.freeze({ KEYS, DEFAULT_DIFFICULTY, normalizeDifficulty, shuffle, createRounds, estimateOwnHand, chooseComputerCard, createGame, getView, selectCard, reveal, next });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DemographyEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);

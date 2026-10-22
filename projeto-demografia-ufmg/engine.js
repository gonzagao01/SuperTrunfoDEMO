(function (root) {
  'use strict';
  const KEYS = Object.freeze(['population', 'lifeExpectancy', 'fertility', 'infantMortality', 'netMigration', 'medianAge']);
  // Hidden hands, reserves and committed choices never leave this module.
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
  // Only its current hand and public rule: no opponent, reserves or future rules.
  // 70% strongest current value; 30% another card. Equal values use random ties.
  function chooseComputerCard(ownHand, rule, random = Math.random) {
    if (!ownHand.length || ownHand.length > 3 || !KEYS.includes(rule.indicator) || !['higher', 'lower'].includes(rule.objective)) throw new Error('Escolha de carta inválida.');
    if (ownHand.length === 1) return ownHand[0].id;
    const direction = rule.objective === 'higher' ? -1 : 1;
    const ranked = shuffle(ownHand, random).sort((a, b) => direction * (a[rule.indicator] - b[rule.indicator]));
    return random() < .7 ? ranked[0].id : ranked[1 + Math.floor(random() * (ranked.length - 1))].id;
  }
  function refill(hand, reserve) {
    while (hand.length < 3 && reserve.length) hand.push(reserve.shift());
  }
  function prepareRound(state) {
    refill(state.playerHand, state.playerReserve);
    refill(state.computerHand, state.computerReserve);
    state.roundHand = Object.freeze([...state.playerHand]);
    // Commit once, BEFORE exposing the round or accepting player input.
    state.computerChoiceId = chooseComputerCard(Object.freeze([...state.computerHand]), state.rounds[state.round], state.random);
  }
  function createGame(deck, random = Math.random) {
    if (deck.length !== 24 || new Set(deck.map(card => card.id)).size !== 24) throw new Error('O baralho deve conter 24 países únicos.');
    for (const card of deck) for (const key of KEYS) if (!Number.isFinite(card[key])) throw new Error('Indicador ausente no baralho.');
    const cards = shuffle(deck.map(card => Object.freeze({ ...card })), random);
    // Full schedule and both allocations are fixed BEFORE the first AI choice.
    const state = {
      rounds: createRounds(random), playerHand: [], computerHand: [],
      playerReserve: cards.slice(0, 12), computerReserve: cards.slice(12),
      round: 0, playerScore: 0, computerScore: 0, ties: 0,
      selectedCardId: null, computerChoiceId: null, revealed: false,
      result: null, history: [], roundHand: Object.freeze([]), random,
    };
    const game = Object.freeze({});
    games.set(game, state);
    prepareRound(state);
    return game;
  }
  // Read-only player snapshot, containing no unrevealed computer card or choice.
  function getView(game) {
    const state = games.get(game);
    if (!state) throw new Error('Partida inválida.');
    return Object.freeze({
      round: state.round, rule: state.rounds[state.round] ?? null,
      playerHand: Object.freeze([...state.playerHand]), roundHand: state.roundHand,
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
    const playerCard = state.playerHand[playerIndex];
    const computerCard = state.computerHand[computerIndex];
    const rule = state.rounds[state.round];
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
  const api = Object.freeze({ KEYS, shuffle, createRounds, chooseComputerCard, createGame, getView, selectCard, reveal, next });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DemographyEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);

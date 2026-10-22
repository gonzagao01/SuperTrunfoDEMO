(function (root) {
  'use strict';
  const KEYS = Object.freeze(['population', 'lifeExpectancy', 'fertility', 'infantMortality', 'netMigration', 'medianAge']);
  const RARITIES = Object.freeze(['Comum', 'Rara', 'Épica']);
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
  // Midranks keep tied values together. With 36 distinct values this gives
  // 18 central Common, 14 intermediate Rare and 4 extreme Epic cards.
  // Boundaries are halfway between target ordinal positions; no objective is used.
  function computeRarities(catalog) {
    if (catalog.length !== 36 || new Set(catalog.map(card => card.id)).size !== 36) throw new Error('O catálogo deve conter 36 países únicos.');
    const result = Object.fromEntries(catalog.map(card => [card.id, {}]));
    for (const key of KEYS) {
      if (catalog.some(card => !Number.isFinite(card[key]))) throw new Error('Indicador ausente no catálogo.');
      const sorted = [...catalog].sort((a, b) => a[key] - b[key]);
      for (let start = 0; start < sorted.length;) {
        let end = start;
        while (end + 1 < sorted.length && sorted[end + 1][key] === sorted[start][key]) end++;
        const midrank = (start + end) / 2 + 1;
        const tailDistance = Math.min(midrank, 37 - midrank);
        const label = tailDistance <= 2.5 ? 'Épica' : tailDistance <= 9.5 ? 'Rara' : 'Comum';
        for (let i = start; i <= end; i++) result[sorted[i].id][key] = label;
        start = end + 1;
      }
    }
    for (const value of Object.values(result)) Object.freeze(value);
    return Object.freeze(result);
  }
  // The decision has no catalog, game handle, numeric card value or opponent hand.
  // Mix a uniform card draw with a uniform rarity-group draw. No rarity or country
  // is ranked as stronger, and neither high/low direction nor hidden values are inferred.
  function chooseComputerCard(information, random = Math.random) {
    const hand = information.hand;
    const allowed = ['id', 'name', 'flag', 'rarity'];
    if (!hand.length || hand.length > 3 || hand.some(card => Object.keys(card).some(key => !allowed.includes(key)) || !RARITIES.includes(card.rarity))) throw new Error('A decisão só pode receber pistas permitidas.');
    if (hand.length === 1) return hand[0].id;
    if (random() < .5) return hand[Math.floor(random() * hand.length)].id;
    const labels = [...new Set(hand.map(card => card.rarity))];
    const label = labels[Math.floor(random() * labels.length)];
    const options = hand.filter(card => card.rarity === label);
    return options[Math.floor(random() * options.length)].id;
  }
  function refill(hand, reserve) {
    while (hand.length < 3 && reserve.length) hand.push(reserve.shift());
  }
  function identity(card) {
    return { id: card.id, name: card.name, flag: card.flag };
  }
  function clue(state, card) {
    return Object.freeze({ ...identity(card), rarity: state.rarities[card.id][state.rounds[state.round].indicator] });
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
      hand: Object.freeze(state.computerHand.map(card => clue(state, card))),
      deck: ownDeck(state.computerDeck, state.computerHand, state.computerReserve),
      rule: state.rounds[state.round],
      history: Object.freeze([...state.history]),
      scores: Object.freeze({ self: state.computerScore, opponent: state.playerScore }),
    });
    // Commit once, before any player input, using only this sanitized snapshot.
    state.computerChoiceId = chooseComputerCard(information, state.random);
  }
  function createGame(catalog, random = Math.random) {
    const rarities = computeRarities(catalog);
    const cards = shuffle(catalog.map(card => Object.freeze({ ...card })), random).slice(0, 24);
    const playerDeck = Object.freeze(cards.slice(0, 12));
    const computerDeck = Object.freeze(cards.slice(12));
    const state = {
      rarities, rounds: createRounds(random), playerDeck, computerDeck,
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
    const mask = card => clue(state, card);
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
    const playerCard = Object.freeze({ ...state.playerHand[playerIndex], rarity: state.rarities[state.selectedCardId][rule.indicator] });
    const computerCard = Object.freeze({ ...state.computerHand[computerIndex], rarity: state.rarities[state.computerChoiceId][rule.indicator] });
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
  const api = Object.freeze({ KEYS, RARITIES, shuffle, createRounds, computeRarities, chooseComputerCard, createGame, getView, selectCard, reveal, next });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DemographyEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);

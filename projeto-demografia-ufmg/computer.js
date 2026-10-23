(function (root) {
  'use strict';
  const rules=typeof module!=='undefined'&&module.exports?require('./rules.js'):root.DemographyRules;
  const DEFAULT_DIFFICULTY=typeof module!=='undefined'&&module.exports?require('./difficulty.js'):root.DEMOGRAPHY_DIFFICULTY;
  const {KEYS,shuffle}=rules;
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
  const api=Object.freeze({DEFAULT_DIFFICULTY,normalizeDifficulty,estimateOwnHand,chooseComputerCard});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DemographyComputer=api;
})(typeof window!=='undefined'?window:globalThis);

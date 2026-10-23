(function (root) {
  'use strict';
  // Editable normal difficulty. Weights apply to the APPROXIMATE ranking.
  const difficulty = Object.freeze({
    rankWeights: Object.freeze([0.70, 0.25, 0.05]),
    uncertainty: 0.15,
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = difficulty;
  else root.DEMOGRAPHY_DIFFICULTY = difficulty;
})(typeof window !== 'undefined' ? window : globalThis);

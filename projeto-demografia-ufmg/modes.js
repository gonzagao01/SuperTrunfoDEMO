(function (root) {
  'use strict';
  // Editorial familiarity lists supplied for the game; never a country ranking.
  const EASY_IDS = Object.freeze(['BRA','USA','CAN','MEX','ARG','CHL','COL','PER','CUB','GBR','FRA','DEU','ESP','PRT','ITA','RUS','UKR','CHN','IND','JPN','KOR','PRK','IDN','PAK','IRN','ISR','SAU','TUR','THA','ZAF','EGY','NGA','MAR','KEN','AUS','NZL']);
  const KNOWN_IDS = Object.freeze(EASY_IDS.filter(id => !['PER','CUB','PRK','SAU','THA','KEN'].includes(id)));
  const LESS_KNOWN_IDS = Object.freeze(['ERI','YEM','KGZ','MLI','MWI','HTI','AFG','TCD','BFA','BEN','TGO','NER','RWA','ZMB','MOZ','MDG','NPL','LAO','KHM','MNG','TJK','UZB','AZE','ARM','MDA','ALB','TLS','VUT','SUR','BLZ']);
  const MODES = Object.freeze({
    easy: Object.freeze({ id:'easy', name:'Fácil', subtitle:'Aprendizado', description:'36 países familiares. Valores visíveis e escolha entre todas as suas cartas restantes.', visibleValues:true, fullDeckSelection:true, bankIds:EASY_IDS }),
    normal: Object.freeze({ id:'normal', name:'Normal', subtitle:'Estratégia', description:'60 países. Três cartas com valores visíveis e uma distribuição equilibrada.', visibleValues:true, fullDeckSelection:false, bankIds:Object.freeze([...KNOWN_IDS,...LESS_KNOWN_IDS]) }),
    hard: Object.freeze({ id:'hard', name:'Difícil', subtitle:'Conhecimento', description:'O banco mundial validado. Três cartas na mão e valores ocultos.', visibleValues:false, fullDeckSelection:false, bankIds:null }),
  });
  function getMode(id) { if (!Object.hasOwn(MODES,id)) throw new Error('Modo de jogo inválido.'); return MODES[id]; }
  const api = Object.freeze({ MODES, EASY_IDS, KNOWN_IDS, LESS_KNOWN_IDS, getMode });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DemographyModes = api;
})(typeof window !== 'undefined' ? window : globalThis);

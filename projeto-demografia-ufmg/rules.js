(function (root) {
  'use strict';
  const KEYS=Object.freeze(['population','lifeExpectancy','fertility','infantMortality','netMigration','medianAge']);
  function shuffle(items,random=Math.random) {
    const result=[...items];
    for(let i=result.length-1;i>0;i--) {
      const j=Math.floor(random()*(i+1));
      [result[i],result[j]]=[result[j],result[i]];
    }
    return result;
  }
  function createRounds(random=Math.random) {
    return Object.freeze(shuffle(KEYS.flatMap(indicator=>[
      Object.freeze({indicator,objective:'higher'}),Object.freeze({indicator,objective:'lower'}),
    ]),random));
  }
  function compare(player,computer,rule) {
    if(!KEYS.includes(rule.indicator)||!['higher','lower'].includes(rule.objective))throw new Error('Regra inválida.');
    const a=player[rule.indicator],b=computer[rule.indicator];
    if(!Number.isFinite(a)||!Number.isFinite(b))throw new Error('Comparação sem indicadores válidos.');
    if(a===b)return 'tie';
    return (rule.objective==='higher'?a>b:a<b)?'player':'computer';
  }
  const api=Object.freeze({KEYS,shuffle,createRounds,compare});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DemographyRules=api;
})(typeof window!=='undefined'?window:globalThis);

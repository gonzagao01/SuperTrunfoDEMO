(function(root) {
  'use strict';
  const modes=typeof module!=='undefined'&&module.exports?require('./modes.js'):root.DemographyModes;
  const {shuffle}=typeof module!=='undefined'&&module.exports?require('./rules.js'):root.DemographyRules;
  function pool(catalog,modeId) {
    const mode=modes.getMode(modeId);
    if(!mode.bankIds)return [...catalog];
    const byId=new Map(catalog.map(card=>[card.id,card]));
    return mode.bankIds.map(id=>{if(!byId.has(id))throw new Error('País ausente no banco do modo: '+id);return byId.get(id);});
  }
  // This module reads country IDs only. Demographic values never affect a deal.
  function deal(catalog,modeId,random=Math.random) {
    const available=pool(catalog,modeId);
    if(available.length<24)throw new Error('O banco precisa de pelo menos 24 países.');
    if(modeId==='normal') {
      const knownSet=new Set(modes.KNOWN_IDS),lessSet=new Set(modes.LESS_KNOWN_IDS);
      const known=shuffle(available.filter(card=>knownSet.has(card.id)),random).slice(0,12);
      const less=shuffle(available.filter(card=>lessSet.has(card.id)),random).slice(0,12);
      return {player:shuffle([...known.slice(0,6),...less.slice(0,6)],random),computer:shuffle([...known.slice(6),...less.slice(6)],random)};
    }
    const chosen=shuffle(available,random).slice(0,24);
    return {player:chosen.slice(0,12),computer:chosen.slice(12)};
  }
  const api=Object.freeze({pool,deal});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DemographySelection=api;
})(typeof window!=='undefined'?window:globalThis);

(function(root){
  'use strict';
  const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
  function filterCountries(countries,geography,{query='',region=''}={}){
    const terms=normalize(query).split(/\s+/).filter(Boolean);
    return countries.filter(country=>(!region||geography.countryRegions[country.id]===region)&&terms.every(term=>normalize(country.name).includes(term)));
  }
  const api=Object.freeze({normalize,filterCountries});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DemographyAtlas=api;
})(typeof window!=='undefined'?window:globalThis);

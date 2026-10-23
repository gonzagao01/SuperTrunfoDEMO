(function(root){
  'use strict';
  const indicators = [
    { key: 'population', label: 'População total', unit: 'hab.', fullUnit: 'habitantes', digits: 0,
      note: 'Número de habitantes do país em 1º de julho de 2024. O tamanho da população não mede o desenvolvimento de um país.' },
    { key: 'lifeExpectancy', label: 'Expectativa de vida', unit: 'anos', fullUnit: 'anos', digits: 2,
      note: 'Anos que um recém-nascido viveria, em média, se as taxas de mortalidade de 2024 permanecessem constantes ao longo de sua vida.' },
    { key: 'fertility', label: 'Taxa de fecundidade', unit: 'filhos/mulher', fullUnit: 'filhos por mulher', digits: 2,
      note: 'Número médio de filhos por mulher em uma geração hipotética sujeita às taxas de fecundidade por idade de 2024.' },
    { key: 'infantMortality', label: 'Mortalidade infantil', unit: '‰ NV', fullUnit: 'óbitos por mil nascidos vivos', digits: 2,
      note: 'Probabilidade de morrer antes de completar um ano, expressa em óbitos por mil nascidos vivos. NV significa nascidos vivos.' },
    { key: 'netMigration', label: 'Taxa líquida de migração', unit: '‰ hab.', fullUnit: 'migrantes líquidos por mil habitantes', digits: 2,
      note: 'Saldo entre imigrantes e emigrantes por mil habitantes. Valores negativos indicam que saíram mais pessoas do que entraram.' },
    { key: 'medianAge', label: 'Idade mediana', unit: 'anos', fullUnit: 'anos', digits: 2,
      note: 'Idade que divide a população em duas metades: uma mais jovem e outra mais velha. Não é a idade média nem a proporção de idosos.' },
  ];
  const api=Object.freeze(indicators.map(item=>Object.freeze(item)));
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DemographyIndicators=api;
})(typeof window!=='undefined'?window:globalThis);

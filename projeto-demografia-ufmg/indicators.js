(function(root){
  'use strict';
  const wpp='https://population.un.org/wpp/assets/Files/WPP2024_Methodology.pdf';
  const indicators=[
    {key:'population',label:'População total',unit:'hab.',fullUnit:'habitantes',digits:0,
      note:'Número de habitantes do país em 1º de julho de 2024. O tamanho da população não mede o desenvolvimento de um país.',
      meaning:'Quantidade de pessoas que compõem a população do país na data de referência, 1º de julho de 2024.',
      interpretation:'Reúne informações de censos, registros e pesquisas, conciliadas pela ONU. Neste banco, o valor de 2024 é uma projeção, não uma contagem censitária daquele ano.',
      relevance:'Ajuda a dimensionar demandas por moradia, educação e serviços, sem resumir as condições de vida da população.',source:wpp},
    {key:'lifeExpectancy',label:'Expectativa de vida ao nascer',unit:'anos',fullUnit:'anos',digits:2,
      note:'Anos que um recém-nascido viveria, em média, se as taxas de mortalidade de 2024 permanecessem constantes ao longo de sua vida.',
      meaning:'Duração média da vida em uma geração hipotética submetida às taxas de mortalidade por idade do ano de referência.',
      interpretation:'É calculada com uma tábua de mortalidade. Não prevê quantos anos uma pessoa específica viverá nem corresponde à idade média das pessoas que morreram.',
      relevance:'Sintetiza o padrão de mortalidade e ajuda a estudar mudanças nas condições de sobrevivência.',source:wpp},
    {key:'fertility',label:'Taxa de fecundidade',unit:'filhos/mulher',fullUnit:'filhos por mulher',digits:2,
      note:'Número médio de filhos por mulher em uma geração hipotética sujeita às taxas de fecundidade por idade de 2024.',
      meaning:'Número médio de filhos que uma mulher teria ao longo do período reprodutivo se as taxas por idade do ano se mantivessem.',
      interpretation:'Soma as taxas de fecundidade por idade, considerando a largura das faixas etárias. É uma medida de período; não é a natalidade, que relaciona nascimentos ao total de habitantes.',
      relevance:'Ajuda a compreender a reprodução da população, suas mudanças de tamanho e sua estrutura etária.',source:'https://data.un.org/Glossary.aspx?q=total+fertility+rate'},
    {key:'infantMortality',label:'Mortalidade infantil',unit:'‰ NV',fullUnit:'óbitos por mil nascidos vivos',digits:2,
      note:'Probabilidade de morrer antes de completar um ano, expressa em óbitos por mil nascidos vivos. NV significa nascidos vivos.',
      meaning:'Probabilidade de uma criança morrer antes do primeiro aniversário, sob o padrão de mortalidade do período.',
      interpretation:'É estimada com registros e pesquisas e expressa por mil nascidos vivos. Por exemplo, 10 por mil representa aproximadamente dez mortes antes de um ano para cada mil nascimentos, sob aquelas condições.',
      relevance:'Ajuda a estudar a sobrevivência infantil e desigualdades nas condições de saúde e de vida.',source:'https://www.who.int/data/gho/indicator-metadata-registry/imr-details/1'},
    {key:'netMigration',label:'Taxa líquida de migração',unit:'‰ hab.',fullUnit:'migrantes líquidos por mil habitantes',digits:2,
      note:'Saldo entre imigrantes e emigrantes por mil habitantes. Valores negativos indicam que saíram mais pessoas do que entraram.',
      meaning:'Saldo da migração internacional em relação ao tamanho da população, expresso por mil habitantes.',
      interpretation:'Subtrai emigrantes de imigrantes e divide o saldo pela população exposta no período (pessoas-ano), multiplicando por mil. Negativo indica mais saídas; positivo, mais entradas. Não mede o total de imigrantes residentes.',
      relevance:'Mostra a contribuição da migração internacional para a dinâmica populacional. Um saldo próximo de zero pode coexistir com muitas entradas e saídas.',source:wpp},
    {key:'medianAge',label:'Idade mediana',unit:'anos',fullUnit:'anos',digits:2,
      note:'Idade que divide a população em duas metades: uma mais jovem e outra mais velha. Não é a idade média nem a proporção de idosos.',
      meaning:'Idade que separa a população em duas metades de igual tamanho: uma mais jovem e outra mais velha.',
      interpretation:'É localizada na distribuição da população por idade. Não se calcula somando todas as idades e dividindo pelo número de pessoas: isso daria a média.',
      relevance:'Resume a estrutura etária e ajuda a estudar envelhecimento populacional e mudanças nas necessidades de serviços.',source:'https://population.un.org/dataportal/data/indicators/67/locations/910/start/1990/end/2023/metadata'},
  ];
  const api=Object.freeze(indicators.map(item=>Object.freeze(item)));
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DemographyIndicators=api;
})(typeof window!=='undefined'?window:globalThis);

(() => {
  'use strict';
  const app=document.getElementById('app'),engine=window.DemographyEngine;
  const data=window.DEMOGRAPHY_DATA,indicators=window.DemographyIndicators,modes=window.DemographyModes;
  const catalog=data.countries,byId=new Map(catalog.map(card=>[card.id,card]));
  const integer=new Intl.NumberFormat('pt-BR');
  const number=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const precise=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:6});
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const storage={get(key){try{return localStorage.getItem(key);}catch{return null;}},set(key,value){try{localStorage.setItem(key,value);}catch{}}};
  const tutorialKey='demografia-tutorial-interativo-v3',modeKey='demografia-modo-v3';
  let selectedMode=storage.get(modeKey)||'easy';
  if(!Object.hasOwn(modes.MODES,selectedMode))selectedMode='easy';
  let tutorialSeen=storage.get(tutorialKey)==='1',game=null,view=null,screen='menu';
  const format=(card,indicator,full=false)=>indicator.key==='population'?integer.format(card[indicator.key]):(full?precise:number).format(card[indicator.key]);
  const currentIndicator=()=>indicators.find(indicator=>indicator.key===view.rule.indicator);
  function flag(card,small=false){return `<img class="${small?'small-flag':'country-flag'}" src="assets/flags/${card.flag}.svg" alt="Bandeira de ${esc(card.name)}" width="${small?32:75}" height="${small?22:50}">`;}
  function header(right='<button class="text-button" data-action="menu">Voltar ao menu</button>'){
    return `<header class="topbar"><span class="brand">Trabalho de Demografia UFMG</span><div class="topbar-right">${right}</div></header>`;
  }
  function menu(){
    screen='menu';document.title='Trabalho de Demografia UFMG';
    app.innerHTML=`<main class="menu"><div class="menu-content"><h1>Trabalho de Demografia UFMG</h1><p class="subtitle">Super Trunfo — Demografia Mundial</p><fieldset class="mode-picker"><legend>Escolha a dificuldade</legend>${Object.values(modes.MODES).map(mode=>`<label class="mode-option"><input type="radio" name="difficulty" value="${mode.id}" ${selectedMode===mode.id?'checked':''}><span><strong>${mode.name} — ${mode.subtitle}</strong><span class="mode-description">${mode.description}</span>${mode.id==='easy'?'<span class="mode-recommendation">Recomendado para a primeira partida.</span>':''}</span></label>`).join('')}</fieldset><button class="primary" data-action="play">Jogar</button><nav class="menu-links" aria-label="Informações"><button class="text-button" data-action="rules">Como jogar</button><button class="text-button" data-action="about">Sobre o projeto</button></nav></div></main>`;
    window.scrollTo(0,0);
  }
  function startGame(){
    const begin=()=>{game=engine.createGame(catalog,{mode:selectedMode});renderGame();window.scrollTo(0,0);};
    if(!tutorialSeen)showTutorial(begin);else begin();
  }
  function instruction(rule,indicator){
    const direction=rule.objective==='higher'?'maior':'menor';
    const noun={population:'a '+direction+' população',lifeExpectancy:'a '+direction+' expectativa de vida',fertility:'a '+direction+' taxa de fecundidade',infantMortality:'a '+direction+' mortalidade infantil',netMigration:'a '+direction+' taxa líquida de migração',medianAge:'a '+direction+' idade mediana'};
    return `Escolha o país que você acredita ter ${noun[indicator.key]}.`;
  }
  function goal(rule,indicator,roundText){
    return `<div class="objective round-goal"><p class="round-count">${roundText}</p><h1 id="round-heading"><span class="objective-value">${rule.objective==='higher'?'MAIOR':'MENOR'} VALOR</span><span class="objective-label">${indicator.label.toLocaleUpperCase('pt-BR')}</span></h1><p class="goal-instruction">${instruction(rule,indicator)}</p></div>`;
  }
  function indicatorRows(card,currentKey,fullCurrent=false){
    return indicators.map(indicator=>`<div class="indicator${indicator.key===currentKey?' selected':''}" aria-label="${indicator.label}: ${format(card,indicator,fullCurrent&&indicator.key===currentKey)} ${indicator.fullUnit}"><span class="indicator-name">${indicator.label}</span><span class="indicator-value">${format(card,indicator,fullCurrent&&indicator.key===currentKey)} <span class="indicator-unit">${indicator.unit}</span></span></div>`).join('');
  }
  function handPicker(){
    return `<div class="hand-picker" role="group" aria-label="Escolha uma carta da sua mão">${view.roundHand.map(card=>`<button type="button" class="secondary hand-choice${view.selectedCardId===card.id?' selected':''}" data-card="${card.id}" aria-pressed="${view.selectedCardId===card.id}" ${view.revealed?'disabled':''}>${flag(card,true)}<span class="hand-country">${esc(card.name)}</span></button>`).join('')}</div>`;
  }
  function learningDeck(){
    return `<section class="learning-deck" aria-label="Escolha qualquer uma das suas cartas disponíveis">${view.playerHand.map(card=>`<button type="button" class="learning-card${view.selectedCardId===card.id?' selected':''}" data-card="${card.id}" aria-pressed="${view.selectedCardId===card.id}"><span class="learning-heading">${flag(card,true)}<strong>${esc(card.name)}</strong></span><span class="learning-indicators">${indicators.map(indicator=>`<span class="learning-row${indicator.key===view.rule.indicator?' active-indicator':''}"><span>${indicator.label}</span><span class="indicator-value">${format(card,indicator,indicator.key===view.rule.indicator)} <span class="indicator-unit">${indicator.unit}</span></span></span>`).join('')}</span></button>`).join('')}</section><p class="computer-commit-note">A carta do computador já está definida e será revelada após a confirmação.</p>`;
  }
  function card(country,owner){
    const nameId=owner+'-country';
    let contents='';
    if(view.revealed){
      const indicator=currentIndicator(),winner=view.result.winner===owner;
      contents=`<div class="compared-value${winner?' winning-value':''}"><span class="comparison-label">${indicator.label}</span><strong class="comparison-number">${format(country,indicator,true)}</strong><span class="comparison-unit">${indicator.fullUnit}</span>${winner?'<span class="comparison-winner">Venceu a rodada</span>':''}</div><details class="full-indicators"><summary>Ver os seis indicadores</summary><div class="indicator-list">${indicatorRows(country,indicator.key,true)}</div></details>`;
    }
    return `<article class="country-card${view.revealed?' reveal-card':' unrevealed-card'}" aria-labelledby="${nameId}"><div class="country-heading">${flag(country)}<h2 class="country-name" id="${nameId}">${esc(country.name)}</h2></div>${contents}</article>`;
  }
  function hiddenCard(){
    return '<article class="country-card hidden-card" aria-label="Carta oculta do computador"><div><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m5 14 5-7h12l5 7H5Zm1 5h20M7 24h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><p class="hidden-title">Carta oculta</p><p class="hidden-description">Será revelada após a confirmação</p></div></article>';
  }
  function explanation(result){
    const indicator=currentIndicator(),a=format(result.playerCard,indicator,true),b=format(result.computerCard,indicator,true);
    if(result.winner==='tie')return `Os dois países têm o mesmo valor: ${a} ${indicator.fullUnit}. Ninguém recebe ponto.`;
    const winning=result.winner==='player'?result.playerCard:result.computerCard;
    const losing=result.winner==='player'?result.computerCard:result.playerCard;
    return `${esc(winning.name)} venceu porque ${format(winning,indicator,true)} é ${result.objective==='higher'?'maior':'menor'} que ${format(losing,indicator,true)} ${indicator.fullUnit}. O objetivo desta rodada era ${result.objective==='higher'?'MAIOR':'MENOR'}.`;
  }
  function renderGame(focusAction=false,focusCard=null){
    view=engine.getView(game);screen='game';document.title=`Rodada ${view.round+1}/12 — ${view.mode.name} — Demografia UFMG`;
    const indicator=currentIndicator(),result=view.result;
    const player=view.revealed?result.playerCard:view.playerHand.find(card=>card.id===view.selectedCardId)??view.playerHand[0];
    const resultTitle=view.revealed?(result.winner==='player'?'Você venceu a rodada. +1 ponto.':result.winner==='computer'?'O computador venceu a rodada. +1 ponto.':'Empate. Nenhum ponto nesta rodada.') : '';
    const arena=view.mode.fullDeckSelection&&!view.revealed?learningDeck():`${view.mode.fullDeckSelection?'':handPicker()}<section class="cards" aria-label="Cartas da rodada">${card(player,'player')}${view.revealed?card(result.computerCard,'computer'):hiddenCard()}</section>`;
    const message=view.revealed?`<div class="round-message" role="status"><h2 class="round-result${result.winner==='tie'?'':' win-text'}">${resultTitle}</h2><p class="round-detail">${explanation(result)}</p><p class="indicator-note">${indicator.note}</p><p class="comparison-context">Verde identifica apenas o valor vencedor nesta comparação. Não indica superioridade entre países.</p></div>`:'';
    app.innerHTML=`<main class="game-shell">${header(`<span>${view.mode.name} · ${view.round+1}/12</span><button class="text-button" data-action="leave">Menu</button>`)}<section class="scoreboard" aria-label="Placar e objetivo"><div class="player-score"><span class="score-label">JOGADOR</span><span class="score-number" aria-label="Jogador: ${view.playerScore} pontos">${view.playerScore}</span></div>${goal(view.rule,indicator,`Rodada ${view.round+1} de 12`)}<div class="computer-score"><span class="score-label">COMPUTADOR</span><span class="score-number" aria-label="Computador: ${view.computerScore} pontos">${view.computerScore}</span></div></section><div class="hand-tools"><span>${view.revealed?'Cartas reveladas':view.mode.fullDeckSelection?`${view.playerHand.length} cartas disponíveis`:'Escolha entre as cartas da sua mão'}</span><button class="text-button" data-action="deck">Ver meu baralho</button></div>${arena}${message}<div class="round-action-wrap${view.mode.fullDeckSelection&&!view.revealed?' sticky-action':''}">${!view.revealed?`<p class="selection-status" role="status">${view.selectedCardId?`Carta selecionada: ${esc(player.name)}`:'Selecione uma carta para continuar.'}</p>`:''}<button class="primary round-action" data-action="${view.revealed?'next':'confirm'}" ${!view.selectedCardId?'disabled':''}>${view.revealed?view.round===11?'Ver resultado':'Próxima rodada':'Confirmar carta'}</button></div></main>`;
    if(focusAction){const heading=app.querySelector('.round-result');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});}
    else if(focusCard)app.querySelector(`[data-card="${focusCard}"]`)?.focus({preventScroll:true});
  }
  function resultScreen(){
    view=engine.getView(game);screen='result';document.title='Resultado — Demografia UFMG';
    const title=view.playerScore>view.computerScore?'Você venceu a partida.':view.playerScore<view.computerScore?'O computador venceu.':'A partida terminou empatada.';
    app.innerHTML=`<main class="menu"><div class="menu-content"><p class="subtitle">${view.mode.name} — ${view.mode.subtitle} · 12 rodadas concluídas</p><h1 class="result-title" tabindex="-1">${title}</h1><div class="result-scores" aria-label="Pontuação final"><div><span class="score-label">JOGADOR</span><span class="score-number">${view.playerScore}</span></div><div><span class="score-label">COMPUTADOR</span><span class="score-number">${view.computerScore}</span></div></div><p class="result-ties">${view.ties} ${view.ties===1?'empate':'empates'} sem pontuação.</p><div class="result-buttons"><button class="primary" data-action="play">Jogar novamente</button><button class="secondary" data-action="menu">Voltar ao menu</button></div></div></main>`;
    window.scrollTo(0,0);app.querySelector('h1').focus({preventScroll:true});
  }
  function listNames(ids){return ids.map(id=>esc(byId.get(id).name)).join(', ');}
  function info(type){
    screen=type;document.title=`${type==='rules'?'Como jogar':'Sobre o projeto'} — Demografia UFMG`;
    const rules=`<h1>Como jogar</h1><ol><li><strong>Leia o objetivo.</strong> MAIOR ou MENOR define qual valor vence no indicador mostrado.</li><li><strong>Escolha uma carta.</strong> No Fácil, veja os números e use qualquer carta disponível. No Normal e no Difícil, escolha entre as três cartas da mão, com os números ocultos.</li><li><strong>Confirme e compare.</strong> As duas cartas são comparadas; o valor vencedor fica verde. A vitória vale um ponto e o empate não dá pontos.</li></ol><button class="secondary" data-action="tutorial">Abrir tutorial interativo</button><h2>Os três modos</h2>${Object.values(modes.MODES).map(mode=>`<h3>${mode.name} — ${mode.subtitle}</h3><p>${mode.description}${mode.id==='normal'?' Cada participante recebe seis países da lista editorial de conhecidos e seis da lista de menos conhecidos.':mode.id==='hard'?' A variedade dos países amplia o desafio; o robô usa o mesmo algoritmo do Normal.':''}</p>`).join('')}<h2>A partida</h2><p>São sorteados 24 países distintos e entregues 12 a cada lado. Cada um dos seis indicadores aparece uma vez com MAIOR e uma com MENOR, em ordem embaralhada.</p><p>O computador escolhe sempre entre suas três cartas, usando estimativas imprecisas e sorte. Sua decisão é definida antes da sua seleção e não muda quando você troca de carta. Os pesos são 70%, 25% e 5% para a primeira, segunda e terceira estimativa; a incerteza é 0,15.</p><p>As cartas utilizadas são descartadas. No Normal e no Difícil, a mão é reposta da reserva enquanto houver cartas; nas duas últimas rodadas restam duas e uma carta. No Fácil, todas as suas cartas restantes estão disponíveis. Vence quem somar mais pontos após 12 rodadas.</p><h2>Ver meu baralho</h2><p>Consulte os 12 países recebidos e seus estados. As cartas da reserva não podem ser jogadas no Normal ou no Difícil. Nesses modos, a consulta não mostra números ocultos.</p><p>O verde marca o resultado da comparação. Os indicadores não classificam países como superiores ou inferiores.</p><button class="primary" data-action="play">Jogar</button>`;
    const about=`<h1>Sobre o projeto</h1><p>Super Trunfo — Demografia Mundial é um trabalho universitário de Demografia da UFMG. O jogo aproxima o estudo da população da comparação de seis indicadores, sem reduzir países a uma classificação de desenvolvimento.</p><h2>Os indicadores</h2>${indicators.map(indicator=>`<details class="definition"><summary>${indicator.label}</summary><p>${indicator.note}</p><p>Unidade: ${indicator.fullUnit}.</p></details>`).join('')}<h2>Dados e cobertura</h2><p class="source-meta">Fonte: ONU, DESA, Divisão de População, <a href="https://population.un.org/wpp/" target="_blank" rel="noopener noreferrer">World Population Prospects 2024</a>, cenário médio. Referência: <strong>2024, projeções</strong>. Nesta revisão, as estimativas históricas terminam em 2023. População e idade mediana referem-se a 1º de julho; as taxas, ao ano de 2024.</p><p class="source-meta">Banco único: ${data.metadata.coverage.countries} países (${data.metadata.coverage.includedMembers} membros da ONU e ${data.metadata.coverage.includedObservers} Estados observadores), com ${data.metadata.coverage.values} valores. Os seis indicadores foram encontrados para todos; nenhum valor ausente foi substituído por zero. Os valores dos 36 países anteriores foram preservados.</p><p class="source-meta">Os dados vieram do <a href="${data.metadata.sourceUrl}" target="_blank" rel="noopener noreferrer">arquivo oficial Medium</a>. Togo utiliza a <a href="${data.metadata.interimUpdate.url}" target="_blank" rel="noopener noreferrer">atualização oficial intermediária</a>. A população foi convertida de milhares em habitantes; a comparação usa a precisão original. Taxas modeladas de Estados muito pequenos exigem particular cautela.</p><p class="source-meta">Consulta em 23 de outubro de 2026. Licença CC BY 3.0 IGO. As bandeiras SVG são locais, obtidas do <a href="https://flagcdn.com/" target="_blank" rel="noopener noreferrer">FlagCDN</a>. Não há consultas a APIs durante as partidas.</p><div class="source-links"><a href="data/countries.csv" download="demografia-ufmg-2024.csv">Baixar dados em CSV</a><a href="data/countries.json" download="demografia-ufmg-2024.json">Dados e metadados em JSON</a></div><h2>Países por modo</h2><p class="source-meta">As listas de familiaridade são uma seleção editorial para o jogo. Não são classificações demográficas ou econômicas.</p><details class="definition"><summary>Fácil — 36 países</summary><p>${listNames(modes.EASY_IDS)}.</p></details><details class="definition"><summary>Normal — 30 conhecidos e 30 menos conhecidos</summary><p>Conhecidos: ${listNames(modes.KNOWN_IDS)}.</p><p>Menos conhecidos: ${listNames(modes.LESS_KNOWN_IDS)}.</p></details><details class="definition"><summary>Difícil — ${catalog.length} países</summary><p>${catalog.map(c=>esc(c.name)).join(', ')}.</p></details>`;
    app.innerHTML=`<main class="info-shell">${header()}<div class="info-content">${type==='rules'?rules:about}</div></main>`;window.scrollTo(0,0);
  }
  function showTutorial(onFinish=null){
    const dialog=document.createElement('dialog');dialog.className='tutorial-dialog';
    let step=0,choice=null;
    const demoRule={indicator:'population',objective:'higher'},indicator=indicators[0],opponent=byId.get('DEU');
    function render(){
      let content='';
      if(step===0)content=`<p>Primeiro, identifique qual valor vence.</p><div class="tutorial-goal">${goal(demoRule,indicator,'Exemplo · não vale pontos')}</div><p>O indicador e o objetivo mudam a cada rodada.</p>`;
      else if(step===1)content=`<p><strong>MAIOR VALOR — POPULAÇÃO TOTAL</strong></p><p>Escolha uma carta de exemplo.</p><div class="tutorial-choices">${['BRA','CAN','JPN'].map(id=>`<button class="secondary${choice===id?' selected':''}" data-demo-card="${id}" aria-pressed="${choice===id}">${flag(byId.get(id),true)}<span>${esc(byId.get(id).name)}</span></button>`).join('')}</div><p>No Fácil você vê os números; nos outros modos, usa seu conhecimento. A carta adversária deste exemplo já está definida.</p>`;
      else{
        const selected=byId.get(choice),winner=engine.compare(selected,opponent,demoRule);
        content=`<div class="tutorial-comparison"><div><span>${esc(selected.name)}</span><strong class="comparison-number${winner==='player'?' winning-value':''}">${format(selected,indicator)}</strong></div><div><span>${esc(opponent.name)}</span><strong class="comparison-number${winner==='computer'?' winning-value':''}">${format(opponent,indicator)}</strong></div></div><p>${winner==='tie'?'Os valores são iguais: empate sem pontos.':`${esc((winner==='player'?selected:opponent).name)} venceu: tem a maior população neste exemplo.`}</p><p>O verde identifica o valor vencedor. Números demográficos não indicam superioridade entre países.</p>`;
      }
      dialog.innerHTML=`<p class="tutorial-progress">Tutorial · passo ${step+1} de 3</p><h2>${['Leia o objetivo','Selecione uma carta','Compare os valores'][step]}</h2>${content}<div class="dialog-actions"><button class="text-button" data-action="tutorial-skip">${step===2?'Fechar':'Pular tutorial'}</button>${step>0?'<button class="secondary" data-action="tutorial-back">Voltar</button>':''}<button class="primary" data-action="tutorial-next" ${step===1&&!choice?'disabled':''}>${step===0?'Próximo':step===1?'Revelar comparação':onFinish?'Entendi, vamos jogar':'Concluir tutorial'}</button></div>`;
    }
    dialog.addEventListener('click',event=>{
      const demo=event.target.closest('[data-demo-card]');
      if(demo){choice=demo.dataset.demoCard;render();dialog.querySelector(`[data-demo-card="${choice}"]`)?.focus();return;}
      const action=event.target.closest('[data-action]')?.dataset.action;
      if(action==='tutorial-skip')dialog.close();
      else if(action==='tutorial-back'){step--;render();}
      else if(action==='tutorial-next'){
        if(step===1&&!choice)return;
        if(step===2)dialog.close();else{step++;render();dialog.querySelector('h2').setAttribute('tabindex','-1');dialog.querySelector('h2').focus();}
      }
    });
    dialog.addEventListener('close',()=>{tutorialSeen=true;storage.set(tutorialKey,'1');dialog.remove();onFinish?.();},{once:true});
    render();app.append(dialog);dialog.showModal();dialog.querySelector('[data-action="tutorial-next"]').focus();
  }
  function showDeck(){
    if(!game)return;const state=engine.getView(game),status={hand:'Na mão',reserve:'Na reserva',discarded:'Descartada'};
    const dialog=document.createElement('dialog');dialog.className='deck-dialog';
    dialog.innerHTML=`<h2>Meu baralho</h2><p>${state.mode.fullDeckSelection?'Todas as cartas ainda não usadas podem ser jogadas.':'Somente as cartas na mão podem ser jogadas.'}</p><ul class="deck-list">${state.playerDeck.map(card=>`<li data-deck-card="${card.id}" data-status="${card.status}">${flag(card,true)}<span class="deck-country">${esc(card.name)}</span><span class="deck-status">${status[card.status]}</span></li>`).join('')}</ul><div class="dialog-actions"><button class="secondary" data-action="close-dialog" autofocus>Voltar à partida</button></div>`;
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});app.append(dialog);dialog.showModal();
  }
  function leaveDialog(){
    const dialog=document.createElement('dialog');dialog.innerHTML='<h2>Voltar ao menu?</h2><p>A partida em andamento será encerrada.</p><div class="dialog-actions"><button class="secondary" data-action="close-dialog" autofocus>Continuar jogando</button><button class="secondary" data-action="menu">Voltar ao menu</button></div>';
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});app.append(dialog);dialog.showModal();
  }
  app.addEventListener('change',event=>{
    if(event.target.matches('input[name="difficulty"]')){selectedMode=event.target.value;storage.set(modeKey,selectedMode);}
  });
  app.addEventListener('click',event=>{
    if(event.target.closest('.tutorial-dialog'))return;
    const choice=event.target.closest('[data-card]');
    if(choice&&screen==='game'&&engine.selectCard(game,choice.dataset.card)){renderGame(false,choice.dataset.card);return;}
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(action==='play')startGame();
    else if(action==='menu'){game=null;view=null;menu();}
    else if(action==='rules'||action==='about')info(action);
    else if(action==='leave')leaveDialog();
    else if(action==='deck'&&screen==='game')showDeck();
    else if(action==='tutorial')showTutorial();
    else if(action==='close-dialog')app.querySelector('dialog')?.close();
    else if(action==='confirm'&&screen==='game'&&engine.reveal(game)){renderGame(true);window.scrollTo(0,0);}
    else if(action==='next'&&screen==='game'&&engine.next(game)){if(engine.getView(game).finished)resultScreen();else{renderGame();window.scrollTo(0,0);}}
  });
  menu();
})();

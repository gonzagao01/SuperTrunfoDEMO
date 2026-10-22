(() => {
  'use strict';
  const app = document.getElementById('app');
  const engine = window.DemographyEngine;
  const data = window.DEMOGRAPHY_DATA;
  const deck = data.countries;
  const decimal = digits => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const integer = new Intl.NumberFormat('pt-BR');
  const indicators = [
    { key: 'population', label: 'População total', unit: 'hab.', fullUnit: 'habitantes', digits: 0,
      note: 'Número de habitantes do país em 1º de julho de 2024. O tamanho da população não mede o desenvolvimento de um país.' },
    { key: 'lifeExpectancy', label: 'Expectativa de vida', unit: 'anos', fullUnit: 'anos', digits: 2,
      note: 'Anos que um recém-nascido viveria, em média, se as taxas de mortalidade de 2024 permanecessem constantes ao longo de sua vida.' },
    { key: 'fertility', label: 'Fecundidade', unit: 'filhos/mulher', fullUnit: 'filhos por mulher', digits: 2,
      note: 'Número médio de filhos por mulher em uma geração hipotética sujeita às taxas de fecundidade por idade de 2024.' },
    { key: 'infantMortality', label: 'Mortalidade infantil', unit: '‰ NV', fullUnit: 'óbitos por mil nascidos vivos', digits: 2,
      note: 'Probabilidade de morrer antes de completar um ano, expressa em óbitos por mil nascidos vivos. NV significa nascidos vivos.' },
    { key: 'netMigration', label: 'Migração líquida', unit: '‰ hab.', fullUnit: 'migrantes líquidos por mil habitantes', digits: 2,
      note: 'Saldo entre imigrantes e emigrantes por mil habitantes. Valores negativos indicam que saíram mais pessoas do que entraram.' },
    { key: 'medianAge', label: 'Idade mediana', unit: 'anos', fullUnit: 'anos', digits: 2,
      note: 'Idade que divide a população em duas metades: uma mais jovem e outra mais velha. Não é a idade média nem a proporção de idosos.' },
  ];
  let game = null;
  let view = null;
  let screen = 'menu';
  const tutorialKey = 'demografia-ufmg-cartas-tutorial-v2';
  let tutorialSeen = false;
  try { tutorialSeen = localStorage.getItem(tutorialKey) === '1'; } catch {}
  const format = (card, indicator) => indicator.key === 'population' ? integer.format(card[indicator.key]) : decimal(indicator.digits).format(card[indicator.key]);
  const objectiveText = () => view.rule.objective === 'higher' ? 'Maior valor vence' : 'Menor valor vence';

  function header(right = '<button class="text-button" data-action="menu">Voltar ao menu</button>') {
    return `<header class="topbar"><span class="brand">Trabalho de Demografia UFMG</span><div class="topbar-right">${right}</div></header>`;
  }
  function menu() {
    screen = 'menu';
    document.title = 'Trabalho de Demografia UFMG';
    app.innerHTML = `<main class="menu"><div class="menu-content"><h1>Trabalho de Demografia UFMG</h1><p class="subtitle">Super Trunfo — Demografia Mundial</p><button class="primary" data-action="play">Jogar</button><nav class="menu-links" aria-label="Informações"><button class="text-button" data-action="rules">Como jogar</button><button class="text-button" data-action="about">Sobre o projeto</button></nav></div></main>`;
    window.scrollTo(0, 0);
  }
  function startGame() {
    game = engine.createGame(deck);
    beginRound();
    if (!tutorialSeen) showTutorial();
  }
  function beginRound() {
    renderGame();
    window.scrollTo(0, 0);
  }
  function handPicker() {
    return `<div class="hand-picker" role="group" aria-label="Escolha uma carta da sua mão">${view.roundHand.map(country => `<button type="button" class="secondary hand-choice${view.selectedCardId === country.id ? ' selected' : ''}" data-card="${country.id}" aria-pressed="${view.selectedCardId === country.id}" ${view.revealed ? 'disabled' : ''}><span class="hand-country">${country.name}</span></button>`).join('')}</div>`;
  }
  function card(country, owner) {
    const nameId = `${owner}-country`;
    const values = view.revealed ? `<div class="indicator-list">${indicators.map(indicator => {
      const classes = `indicator${view.rule.indicator === indicator.key ? ' selected' : ''}`;
      const accessible = `${indicator.label}: ${format(country, indicator)} ${indicator.fullUnit}`;
      return `<div class="${classes}" aria-label="${accessible}"><span class="indicator-name">${indicator.label}</span><span class="indicator-value">${format(country, indicator)} <span class="indicator-unit">${indicator.unit}</span></span></div>`;
    }).join('')}</div>` : '';
    return `<article class="country-card${view.revealed ? '' : ' unrevealed-card'}" aria-labelledby="${nameId}"><div class="country-heading"><img class="country-flag" src="assets/flags/${country.flag}.svg" alt="Bandeira de ${country.name}" width="75" height="50"><div class="country-name-row"><h2 class="country-name" id="${nameId}">${country.name}</h2></div></div>${values}</article>`;
  }
  function hiddenCard() {
    return `<article class="country-card hidden-card" aria-label="Carta oculta do computador"><div><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m5 14 5-7h12l5 7H5Zm1 5h20M7 24h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><p class="hidden-title">Carta oculta</p><p class="hidden-description">Será revelada após a confirmação</p></div></article>`;
  }
  function renderGame(focusAction = false, focusCardId = null) {
    view = engine.getView(game);
    screen = 'game';
    document.title = `Rodada ${view.round + 1}/12 — Demografia UFMG`;
    const result = view.result;
    const player = view.revealed ? result.playerCard : view.playerHand.find(country => country.id === view.selectedCardId) ?? view.playerHand[0];
    const computer = view.revealed ? result.computerCard : null;
    const indicator = indicators.find(item => item.key === view.rule.indicator);
    let message = '';
    if (view.revealed) {
      const title = result.winner === 'player' ? 'Você venceu a rodada.' : result.winner === 'computer' ? 'O computador venceu a rodada.' : 'Empate. Nenhum ponto nesta rodada.';
      message = `<div class="round-message" role="status"><p class="round-result${result.winner === 'player' ? ' win-text' : ''}">${title}</p><p class="round-detail">${indicator.label}: ${player.name} ${format(player, indicator)} × ${computer.name} ${format(computer, indicator)} ${indicator.unit}. ${objectiveText()}.</p><p class="indicator-note">${indicator.note}</p></div>`;
    }
    app.innerHTML = `<main class="game-shell">${header(`<span>Rodada ${view.round + 1}/12</span><button class="text-button" data-action="leave">Menu</button>`)}<section class="scoreboard" aria-label="Placar e objetivo"><div><span class="score-label">JOGADOR</span><span class="score-number" aria-label="Jogador: ${view.playerScore} pontos">${view.playerScore}</span></div><div class="objective"><span class="objective-label">${indicator.label.toLocaleUpperCase('pt-BR')}</span><p class="objective-value">${objectiveText()}</p><p class="turn-label">${view.revealed ? 'Rodada encerrada' : 'Escolha uma carta'}</p></div><div class="computer-score"><span class="score-label">COMPUTADOR</span><span class="score-number" aria-label="Computador: ${view.computerScore} pontos">${view.computerScore}</span></div></section><div class="hand-tools"><button class="text-button" data-action="deck">Ver meu baralho</button></div>${handPicker()}<section class="cards" aria-label="Cartas da rodada">${card(player, 'player')}${view.revealed ? card(computer, 'computer') : hiddenCard()}</section>${message}<button class="primary round-action" data-action="${view.revealed ? 'next' : 'confirm'}" ${!view.selectedCardId ? 'disabled' : ''}>${view.revealed ? view.round === 11 ? 'Ver resultado' : 'Próxima rodada' : 'Confirmar carta'}</button><span class="sr-only" role="status"></span></main>`;
    if (focusAction) app.querySelector('.round-action').focus({ preventScroll: true });
    else if (focusCardId) app.querySelector(`[data-card="${focusCardId}"]`)?.focus({ preventScroll: true });
  }
  function resultScreen() {
    view = engine.getView(game);
    screen = 'result';
    document.title = 'Resultado — Demografia UFMG';
    const title = view.playerScore > view.computerScore ? 'Você venceu a partida.' : view.playerScore < view.computerScore ? 'O computador venceu.' : 'A partida terminou empatada.';
    app.innerHTML = `<main class="menu"><div class="menu-content"><h1 class="result-title">${title}</h1><div class="result-scores" aria-label="Pontuação final"><div><span class="score-label">JOGADOR</span><span class="score-number">${view.playerScore}</span></div><div><span class="score-label">COMPUTADOR</span><span class="score-number">${view.computerScore}</span></div></div><div class="result-buttons"><button class="primary" data-action="play">Jogar novamente</button><button class="secondary" data-action="menu">Voltar ao menu</button></div></div></main>`;
    window.scrollTo(0, 0);
    app.querySelector('h1').setAttribute('tabindex', '-1');
    app.querySelector('h1').focus({ preventScroll: true });
  }
  function info(type) {
    screen = type;
    document.title = `${type === 'rules' ? 'Como jogar' : 'Sobre o projeto'} — Demografia UFMG`;
    const rules = `<h1>Como jogar</h1>${tutorialSteps()}<button class="secondary" data-action="tutorial">Ver tutorial</button><h2>A partida</h2><ol><li>São sorteados 24 dos 36 países. Cada lado recebe 12 cartas: três na mão e nove na própria reserva.</li><li>O jogo sorteia a sequência completa de 12 rodadas. Cada indicador aparece uma vez com MAIOR e uma com MENOR.</li><li>Antes da disputa, você vê somente a bandeira e o nome do país. Escolha uma das três cartas e clique em <strong>Confirmar carta</strong>. Você pode mudar de escolha antes de confirmar.</li><li>O computador avalia suas três cartas com estimativas aproximadas e uma parcela de sorte. Considera o indicador e o objetivo, sem conhecer sua carta oculta. Sua decisão é definida antes da sua escolha.</li><li>Após confirmar, os seis indicadores das duas cartas ficam disponíveis, com o indicador da rodada destacado. A vitória vale um ponto; o empate não dá pontos.</li><li>As cartas usadas são descartadas. Ao avançar, cada mão recebe uma carta da própria reserva enquanto houver cartas. As duas últimas rodadas têm duas cartas e depois uma. Vence quem somar mais pontos ao final.</li></ol><h2>Ver meu baralho</h2><p>A opção mostra os 12 países recebidos, com bandeiras e os estados Na mão, Na reserva ou Descartada. Não mostra valores. Só as cartas na mão podem ser jogadas.</p><p>As taxas reveladas usam duas casas decimais; a comparação usa a precisão original da fonte. Maior ou menor é apenas uma regra lúdica e não representa superioridade social ou econômica.</p><button class="primary" data-action="play">Jogar</button>`;
    const about = `<h1>Sobre o projeto</h1><p>Super Trunfo — Demografia Mundial é um trabalho universitário de Demografia da UFMG. O jogo aproxima o estudo da população da comparação de seis indicadores, sem reduzir países a uma classificação de desenvolvimento.</p><h2>Os indicadores</h2>${indicators.map(indicator => `<details class="definition"><summary>${indicator.label}</summary><p>${indicator.note}</p><p>Unidade: ${indicator.fullUnit}.</p></details>`).join('')}<h2>Dados e fontes</h2><p class="source-meta">Fonte: Nações Unidas, Departamento de Assuntos Econômicos e Sociais (DESA), Divisão de População. <a href="https://population.un.org/wpp/" target="_blank" rel="noopener noreferrer">World Population Prospects 2024</a>, revisão de 2024, cenário médio (<em>Medium</em>).</p><p class="source-meta"><strong>Referência: 2024. Natureza: projeções.</strong> Nesta revisão, as estimativas históricas vão até 2023 e as projeções começam em 2024. População e idade mediana referem-se a 1º de julho; as taxas, ao ano de 2024. Não são contagens censitárias de 2024.</p><p class="source-meta">São 36 países e 216 valores, extraídos diretamente do arquivo oficial <a href="${data.metadata.sourceUrl}" target="_blank" rel="noopener noreferrer">Demographic Indicators — Medium</a>. A população original, em milhares, foi convertida em habitantes. Os outros valores mantêm a precisão da fonte. Consulta em 22 de outubro de 2026. Dados sob licença CC BY 3.0 IGO.</p><ul class="source-fields">${indicators.map(indicator => `<li>${indicator.label}: <code>${data.metadata.columns[indicator.key]}</code> · ${indicator.fullUnit}</li>`).join('')}</ul><div class="source-links"><a href="data/countries.csv" download="demografia-ufmg-2024.csv">Baixar dados em CSV</a><a href="data/countries.json" download="demografia-ufmg-2024.json">Dados e metadados em JSON</a></div><h2>Países do baralho</h2><p class="source-meta">${deck.map(country => country.name).join(', ')}.</p><h2>Leitura dos resultados</h2><p class="source-meta">O objetivo maior ou menor é uma regra lúdica e não representa superioridade social ou econômica. Os indicadores descrevem aspectos diferentes da dinâmica populacional e exigem contexto para sua interpretação.</p><p class="source-meta">As bandeiras são imagens SVG armazenadas no próprio projeto, obtidas do <a href="https://flagcdn.com/" target="_blank" rel="noopener noreferrer">FlagCDN</a>. O jogo carrega seus dados e recursos localmente, sem consultar APIs durante a partida.</p>`;
    app.innerHTML = `<main class="info-shell">${header()}<div class="info-content">${type === 'rules' ? rules : about}</div></main>`;
    window.scrollTo(0, 0);
  }
  function tutorialSteps() {
    return `<ol class="tutorial-steps"><li>O jogo sorteia o indicador e o objetivo da rodada.</li><li>Escolha uma das três cartas da sua mão.</li><li>As cartas são reveladas e seus valores são comparados.</li></ol>`;
  }
  function showTutorial() {
    const dialog = document.createElement('dialog');
    dialog.className = 'tutorial-dialog';
    dialog.innerHTML = `<h2>Antes de começar</h2>${tutorialSteps()}<div class="dialog-actions"><button class="primary" data-action="close-dialog" autofocus>Entendi, vamos jogar</button></div>`;
    dialog.addEventListener('close', () => {
      tutorialSeen = true;
      try { localStorage.setItem(tutorialKey, '1'); } catch {}
      dialog.remove();
    }, { once: true });
    app.append(dialog);
    dialog.showModal();
  }
  function showDeck() {
    if (!game) return;
    const cards = engine.getView(game).playerDeck;
    const status = { hand: 'Na mão', reserve: 'Na reserva', discarded: 'Descartada' };
    const dialog = document.createElement('dialog');
    dialog.className = 'deck-dialog';
    dialog.innerHTML = `<h2>Meu baralho</h2><ul class="deck-list">${cards.map(country => `<li data-deck-card="${country.id}" data-status="${country.status}"><img src="assets/flags/${country.flag}.svg" alt="Bandeira de ${country.name}" width="32" height="22"><span class="deck-country">${country.name}</span><span class="deck-status">${status[country.status]}</span></li>`).join('')}</ul><div class="dialog-actions"><button class="secondary" data-action="close-dialog" autofocus>Voltar à partida</button></div>`;
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    app.append(dialog);
    dialog.showModal();
  }
  function leaveDialog() {
    const dialog = document.createElement('dialog');
    dialog.innerHTML = '<h2>Voltar ao menu?</h2><p>A partida em andamento será encerrada.</p><div class="dialog-actions"><button class="secondary" data-action="cancel-leave" autofocus>Continuar jogando</button><button class="secondary" data-action="menu">Voltar ao menu</button></div>';
    app.append(dialog);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    dialog.showModal();
  }
  app.addEventListener('click', event => {
    const choice = event.target.closest('[data-card]');
    if (choice && screen === 'game' && engine.selectCard(game, choice.dataset.card)) {
      renderGame(false, choice.dataset.card);
      return;
    }
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'play') startGame();
    else if (action === 'menu') { game = null; view = null; menu(); }
    else if (action === 'rules' || action === 'about') info(action);
    else if (action === 'leave') leaveDialog();
    else if (action === 'deck' && screen === 'game') showDeck();
    else if (action === 'tutorial') showTutorial();
    else if (action === 'close-dialog') app.querySelector('dialog')?.close();
    else if (action === 'cancel-leave') app.querySelector('dialog')?.close();
    else if (action === 'confirm' && screen === 'game' && engine.reveal(game)) renderGame(true);
    else if (action === 'next' && screen === 'game' && engine.next(game)) {
      if (engine.getView(game).finished) resultScreen(); else beginRound();
    }
  });
  menu();
})();

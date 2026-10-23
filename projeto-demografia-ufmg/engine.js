(function(root) {
  'use strict';
  const server=typeof module!=='undefined'&&module.exports;
  const rules=server?require('./rules.js'):root.DemographyRules;
  const selection=server?require('./selection.js'):root.DemographySelection;
  const computer=server?require('./computer.js'):root.DemographyComputer;
  const modes=server?require('./modes.js'):root.DemographyModes;
  const games=new WeakMap();
  function refill(hand,reserve) {while(hand.length<3&&reserve.length)hand.push(reserve.shift());}
  function identity(card) {return {id:card.id,name:card.name,flag:card.flag};}
  function ownCard(state,card) {return Object.freeze(state.mode.visibleValues?{...card}:identity(card));}
  function prepareRound(state) {
    if(!state.mode.fullDeckSelection)refill(state.playerHand,state.playerReserve);
    refill(state.computerHand,state.computerReserve);
    state.roundHand=Object.freeze([...state.playerHand]);
    const information=Object.freeze({
      hand:computer.estimateOwnHand(Object.freeze([...state.computerHand]),state.rounds[state.round],state.random,state.difficulty),
      objective:state.rounds[state.round].objective,
    });
    // Fixed before any player input. Both hidden-value modes use this exact path.
    state.computerChoiceId=computer.chooseComputerCard(information,state.random,state.difficulty);
  }
  function createGame(catalog,{mode:modeId='normal',random=Math.random,difficulty=computer.DEFAULT_DIFFICULTY}={}) {
    const mode=modes.getMode(modeId);
    if(catalog.length<24||new Set(catalog.map(card=>card.id)).size!==catalog.length)throw new Error('Catálogo inválido ou com países repetidos.');
    for(const card of catalog)for(const key of rules.KEYS)if(!Number.isFinite(card[key]))throw new Error('Indicador ausente no catálogo.');
    const settings=computer.normalizeDifficulty(difficulty);
    const dealt=selection.deal(catalog,modeId,random);
    const clone=cards=>Object.freeze(cards.map(card=>Object.freeze({...card})));
    const playerDeck=clone(dealt.player),computerDeck=clone(dealt.computer);
    const state={mode,difficulty:settings,rounds:rules.createRounds(random),playerDeck,computerDeck,
      playerHand:mode.fullDeckSelection?[...playerDeck]:[],playerReserve:mode.fullDeckSelection?[]:[...playerDeck],
      computerHand:[],computerReserve:[...computerDeck],round:0,playerScore:0,computerScore:0,ties:0,
      selectedCardId:null,computerChoiceId:null,revealed:false,result:null,history:[],roundHand:Object.freeze([]),random};
    const game=Object.freeze({});games.set(game,state);prepareRound(state);return game;
  }
  function getView(game) {
    const state=games.get(game);if(!state)throw new Error('Partida inválida.');
    const active=new Set(state.playerHand.map(c=>c.id)),waiting=new Set(state.playerReserve.map(c=>c.id));
    return Object.freeze({
      mode:state.mode,round:state.round,rule:state.rounds[state.round]??null,
      playerHand:Object.freeze(state.round<12?state.playerHand.map(card=>ownCard(state,card)):[]),
      roundHand:Object.freeze(state.round<12?state.roundHand.map(card=>ownCard(state,card)):[]),
      playerDeck:Object.freeze(state.playerDeck.map(card=>Object.freeze({...ownCard(state,card),status:active.has(card.id)?'hand':waiting.has(card.id)?'reserve':'discarded'}))),
      playerReserveCount:state.playerReserve.length,computerHandCount:state.computerHand.length,computerReserveCount:state.computerReserve.length,
      selectedCardId:state.selectedCardId,revealed:state.revealed,playerScore:state.playerScore,computerScore:state.computerScore,ties:state.ties,
      result:state.result,history:Object.freeze([...state.history]),finished:state.round===12,
    });
  }
  function selectCard(game,id) {
    const state=games.get(game);
    if(!state||state.revealed||state.round>=12||!state.playerHand.some(card=>card.id===id))return false;
    state.selectedCardId=id;return true;
  }
  function reveal(game) {
    const state=games.get(game);
    if(!state||state.revealed||!state.selectedCardId||state.round>=12)return null;
    const p=state.playerHand.findIndex(card=>card.id===state.selectedCardId),c=state.computerHand.findIndex(card=>card.id===state.computerChoiceId);
    if(p<0||c<0)return null;
    const rule=state.rounds[state.round],playerCard=state.playerHand[p],computerCard=state.computerHand[c];
    const winner=rules.compare(playerCard,computerCard,rule);
    if(winner==='player')state.playerScore++;else if(winner==='computer')state.computerScore++;else state.ties++;
    state.playerHand.splice(p,1);state.computerHand.splice(c,1);state.revealed=true;
    state.result=Object.freeze({round:state.round+1,...rule,playerCard,computerCard,winner});state.history.push(state.result);return state.result;
  }
  function next(game) {
    const state=games.get(game);if(!state||!state.revealed||state.round>=12)return false;
    state.round++;state.selectedCardId=null;state.computerChoiceId=null;state.revealed=false;state.result=null;state.roundHand=Object.freeze([]);
    if(state.round<12)prepareRound(state);return true;
  }
  const api=Object.freeze({...rules,...computer,createGame,getView,selectCard,reveal,next});
  if(server)module.exports=api;else root.DemographyEngine=api;
})(typeof window!=='undefined'?window:globalThis);

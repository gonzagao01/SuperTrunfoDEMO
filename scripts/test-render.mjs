// Exercises the real app templates with a test-only equal-value dataset. This
// tiny event/DOM stub is not a browser substitute; browser matches are audited
// separately in qa/ui-results.json. No fixture reaches the published catalogue.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),engine=require('../projeto-demografia-ufmg/engine.js');
const data=JSON.parse(readFileSync(new URL('../projeto-demografia-ufmg/data/countries.json',import.meta.url)));
const source=readFileSync(new URL('../projeto-demografia-ufmg/app.js',import.meta.url),'utf8');
const modes=require('../projeto-demografia-ufmg/modes.js'),indicators=require('../projeto-demografia-ufmg/indicators.js');
const rules=[];
for(const mode of Object.keys(modes.MODES)){
  const listeners={},app={innerHTML:'',addEventListener(type,callback){listeners[type]=callback;},querySelector(){return {setAttribute(){},focus(){}};}};
  const tied={...data,countries:data.countries.map(card=>({...card,...Object.fromEntries(engine.KEYS.map(key=>[key,1]))}))};
  const document={getElementById(){return app;},title:''};
  const window={DemographyEngine:engine,DEMOGRAPHY_DATA:tied,DemographyIndicators:indicators,DemographyModes:modes,scrollTo(){}};
  const localStorage={getItem(key){return key.includes('tutorial')?'1':mode;},setItem(){}};
  vm.runInNewContext(source,{window,document,localStorage,Intl,console});
  const click=(action,id)=>listeners.click({target:{closest(selector){if(selector==='.tutorial-dialog')return null;if(selector==='[data-card]')return id?{dataset:{card:id}}:null;if(selector==='[data-action]')return action?{dataset:{action}}:null;return null;}}});
  click('play');
  for(let round=0;round<12;round++){
    assert.match(app.innerHTML,new RegExp(`Rodada ${round+1} de 12`));
    assert.equal((app.innerHTML.match(/class="indicator-value"/g)||[]).length,mode==='easy'?(12-round)*6:0);
    const id=app.innerHTML.match(/data-card="([A-Z]{3})"/)[1];click(null,id);click('confirm');
    assert.match(app.innerHTML,/Empate\. Nenhum ponto nesta rodada/);assert.match(app.innerHTML,/Ninguém recebe ponto/);
    assert.equal((app.innerHTML.match(/class="compared-value"/g)||[]).length,2);
    assert.doesNotMatch(app.innerHTML,/winning-value/);
    assert.equal((app.innerHTML.match(/class="full-indicators"/g)||[]).length,2);
    assert.match(app.innerHTML,/Jogador: 0 pontos/);assert.match(app.innerHTML,/Computador: 0 pontos/);
    const goal=app.innerHTML.match(/class="objective-value">([^<]+)/)[1];rules.push({mode,goal});click('next');
  }
  assert.match(app.innerHTML,/A partida terminou empatada/);assert.match(app.innerHTML,/12 empates sem pontuação/);
  assert.equal(rules.filter(r=>r.mode===mode&&r.goal==='MAIOR VALOR').length,6);
  assert.equal(rules.filter(r=>r.mode===mode&&r.goal==='MENOR VALOR').length,6);
}
console.log('PASS: real app templates render all 36 tied rounds correctly, MAIOR/MENOR, no green winner, zero points, secondary indicators and final tie.');

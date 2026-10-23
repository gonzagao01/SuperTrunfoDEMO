import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const require=createRequire(import.meta.url),engine=require('../projeto-demografia-ufmg/engine.js');
const modes=require('../projeto-demografia-ufmg/modes.js'),indicators=require('../projeto-demografia-ufmg/indicators.js'),atlas=require('../projeto-demografia-ufmg/atlas.js');
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const data=JSON.parse(read('../projeto-demografia-ufmg/data/countries.json')),geo=JSON.parse(read('../projeto-demografia-ufmg/data/geography.json'));
assert.equal(createHash('sha256').update(read('../projeto-demografia-ufmg/data/countries.json')).digest('hex'),'8d883b71d395a5bf58a86c8a58a1320d1250e6e7740da69ea8b25a668a30bb4e','The reviewed 194-country dataset must remain byte-identical');
assert.deepEqual(JSON.parse(read('../projeto-demografia-ufmg/data/geography.js').split('window.DEMOGRAPHY_GEOGRAPHY = ')[1].trim().slice(0,-1)),geo);
assert.equal(Object.keys(geo.countryRegions).length,194);
const counts={'002':54,'019':35,'142':47,'150':44,'009':14};
for(const [region,count]of Object.entries(counts))assert.equal(atlas.filterCountries(data.countries,geo,{region}).length,count);
for(const card of data.countries)assert.ok(Object.hasOwn(geo.regions,geo.countryRegions[card.id]));
assert.equal(geo.countryRegions.RUS,'150');assert.equal(geo.countryRegions.TUR,'142');assert.equal(geo.countryRegions.VAT,'150');assert.equal(geo.countryRegions.PSE,'142');
assert.equal(atlas.filterCountries(data.countries,geo).length,194);
assert.equal(geo.countryRegions.ISR,undefined);
assert.equal(atlas.filterCountries(data.countries,geo,{query:'Israel'}).length,0);
assert.deepEqual(atlas.filterCountries(data.countries,geo,{query:'  JAPAO  '}).map(c=>c.id),['JPN']);
assert.deepEqual(atlas.filterCountries(data.countries,geo,{query:'coreia sul',region:'142'}).map(c=>c.id),['KOR']);
assert.equal(atlas.filterCountries(data.countries,geo,{query:'Brasil',region:'150'}).length,0);
assert.equal(atlas.filterCountries(data.countries,geo,{query:'<script>alert(1)</script>'}).length,0);
for(const row of read('fixtures/m49-regions.csv').trim().split('\n').slice(1)){
 const [id,,iso2,code]=row.split(',');assert.equal(code,geo.countryRegions[id]);assert.equal(iso2.toLowerCase(),data.countries.find(c=>c.id===id).flag);
}
assert.ok(modes.MODES.easy.visibleValues&&modes.MODES.normal.visibleValues&&!modes.MODES.hard.visibleValues);
assert.ok(modes.MODES.easy.fullDeckSelection&&!modes.MODES.normal.fullDeckSelection);
const source=read('../projeto-demografia-ufmg/app.js');
function harness(mode='normal'){
 const listeners={},dialogs=[],nodes=new Map();
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',setAttribute(){},focus(){}});return nodes.get(selector);};
 const app={innerHTML:'',addEventListener(type,callback){listeners[type]=callback;},querySelector:node,querySelectorAll(){return dialogs.filter(d=>d.open);},append(dialog){dialogs.push(dialog);}};
 const document={getElementById(){return app;},createElement(){
   const events={};const dialog={innerHTML:'',open:false,setAttribute(){},addEventListener(type,callback){events[type]=callback;},querySelector:node,showModal(){this.open=true;},close(){this.open=false;events.close?.();},remove(){const i=dialogs.indexOf(this);if(i>=0)dialogs.splice(i,1);}};return dialog;
 },title:''};
 const window={DemographyEngine:engine,DEMOGRAPHY_DATA:data,DemographyIndicators:indicators,DemographyModes:modes,DEMOGRAPHY_GEOGRAPHY:geo,DemographyAtlas:atlas,scrollTo(){}};
 const localStorage={getItem(key){return key.includes('tutorial')?'1':mode;},setItem(){}};
 vm.runInNewContext(source,{window,document,localStorage,Intl,console});
 const click=values=>listeners.click({target:{closest(selector){const map={'[data-action]':['action','action'],'[data-card]':['card','card'],'[data-country]':['country','country'],'[data-indicator]':['indicator','indicator'],'[data-compare-country]':['compareCountry','compareCountry']};const info=map[selector];return info&&values[info[0]]?{dataset:{[info[1]]:values[info[0]]}}:null;}}});
 const change=(id,value)=>listeners.change({target:{id,value,matches(){return false;}}});
 return {app,dialogs,node,click,change};
}
const h=harness();h.click({action:'atlas'});
assert.equal((h.app.innerHTML.match(/class="catalog-country"/g)||[]).length,194);
assert.doesNotMatch(h.app.innerHTML,/Israel|value="ISR"|data-country="ISR"/);
h.click({country:'ISR'});assert.equal(h.dialogs.length,0);
assert.match(h.app.innerHTML,/id="country-search"/);assert.match(h.app.innerHTML,/id="country-region"/);
const full=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:6}),integer=new Intl.NumberFormat('pt-BR');
for(const country of data.countries){
 h.click({country:country.id});const dialog=h.dialogs.at(-1);assert.match(dialog.innerHTML,/2024 · projeções/);
 assert.equal((dialog.innerHTML.match(/data-indicator=/g)||[]).length,6);
 for(const key of engine.KEYS)assert.ok(dialog.innerHTML.includes(key==='population'?integer.format(country[key]):full.format(country[key])),`${country.id} ${key}: inconsistent catalogue value`);
 assert.doesNotMatch(dialog.innerHTML,/winning-value|score-number|Venceu a rodada/);
 h.click({action:'close-dialog'});assert.equal(h.dialogs.length,0);
}
h.click({country:'BRA'});
for(const indicator of indicators){
 h.click({indicator:indicator.key});assert.equal(h.dialogs.length,2);
 const help=h.dialogs.at(-1).innerHTML;
 for(const field of ['meaning','interpretation','relevance','source'])assert.ok(help.includes(indicator[field]));
 h.click({action:'close-dialog'});assert.equal(h.dialogs.length,1,'Closing a definition must keep the country card open');
}
h.click({compareCountry:'BRA'});assert.equal(h.dialogs.length,0);
for(const [a,b]of [['BRA','JPN'],['VAT','IND'],['TGO','TUR'],['BRA','BRA']]){
 h.change('compare-a',a);h.change('compare-b',b);const output=h.node('#comparison-output').innerHTML;
 assert.equal((output.match(/data-study-indicator=/g)||[]).length,6);
 assert.equal((output.match(/data-study-country=/g)||[]).length,12);
 assert.doesNotMatch(output,/winning-value|Venceu|ponto/);
 for(const id of [a,b])for(const key of engine.KEYS){const country=data.countries.find(c=>c.id===id);assert.ok(output.includes(key==='population'?integer.format(country[key]):full.format(country[key])));}
}
// Catalogue opening cannot expose country values or destroy an active match
// until the user explicitly chooses the clearly labelled end-and-open action.
const playing=harness('hard');playing.click({action:'play'});
const initial=playing.app.innerHTML;playing.click({action:'atlas'});
assert.equal(playing.app.innerHTML,initial);assert.match(playing.dialogs.at(-1).innerHTML,/progresso não será salvo/);
assert.match(playing.dialogs.at(-1).innerHTML,/Encerrar e abrir Baralho/);assert.doesNotMatch(playing.app.innerHTML,/catalog-grid/);
playing.click({action:'close-dialog'});assert.equal(playing.app.innerHTML,initial);
playing.click({action:'leave'});playing.click({action:'end-atlas'});assert.match(playing.app.innerHTML,/class="catalog-grid"/);
console.log('PASS: 194 country cards / all 1164 catalogue values match the game; 5 official regions, accent-insensitive search and combined filters.');
console.log('PASS: six indicator explanations, nested-dialog close, neutral comparison (including identical countries), no in-game catalogue bypass or silent progress loss.');

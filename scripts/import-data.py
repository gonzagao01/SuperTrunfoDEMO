"""Import official 2024 Medium projections; never fetch or fill missing values.
Usage: python3 scripts/import-data.py /directory/with/official/sources
Required: Medium CSV.gz, official update ZIP, un-members.html, un-observers.html.
"""
import csv, gzip, hashlib, html, io, json, re, subprocess, sys, unicodedata, zipfile
from decimal import Decimal
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'projeto-demografia-ufmg'
FIELDS={'population':'TPopulation1July','lifeExpectancy':'LEx','fertility':'TFR','infantMortality':'IMR','netMigration':'CNMR','medianAge':'MedianAgePop'}
SOURCE='https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_Demographic_Indicators_Medium.csv.gz'
UPDATE='https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/WPP2024_CSV_files_update.zip'
ALIASES={'Bahamas (The)':'BHS',"China (the People's Republic of)":'CHN',"Democratic People's Republic of Korea":'PRK','Gambia (Republic of The)':'GMB','Micronesia (Federated States of)':'FSM','Naoero':'NRU','Netherlands (Kingdom of the)':'NLD','United Kingdom of Great Britain and Northern Ireland':'GBR'}
OVERRIDES={'GBR':'Reino Unido','PRK':'Coreia do Norte','IRN':'Irã','SAU':'Arábia Saudita','LAO':'Laos','MDA':'Moldávia','TLS':'Timor-Leste','PSE':'Estado da Palestina','VAT':'Santa Sé (Vaticano)','NRU':'Nauru (Naoero)','COD':'República Democrática do Congo','COG':'Congo'}
# Game curation is separate from statistical completeness. Keep source evidence
# for auditing, but never restore an editorially excluded country on re-import.
EDITORIAL_EXCLUSIONS={'ISR':'Exclusão editorial solicitada para o jogo; não indica ausência ou invalidade dos dados.'}
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def normalize(value): return ''.join(c for c in unicodedata.normalize('NFKD',value.lower()) if c.isalnum())
def node(script,value=None):
    result=subprocess.run(['node','-e',script],input=json.dumps(value),text=True,capture_output=True,check=True,cwd=ROOT)
    return json.loads(result.stdout)

def extract(cache):
    original=cache/'WPP2024_Demographic_Indicators_Medium.csv.gz'
    update=cache/'WPP2024_CSV_files_update.zip'
    old=json.loads((ROOT/'scripts/fixtures/original-36.json').read_text())
    assert digest(original)==old['metadata']['sourceSha256'],'Source revision changed; review before importing'
    with gzip.open(original,'rt',encoding='utf-8-sig') as f:
        rows={r['ISO3_code']:r for r in csv.DictReader(f) if r['ISO3_code'] and r['Time']=='2024' and r['Variant']=='Medium'}
    assert len(rows)==237
    names={normalize(r['Location']):iso for iso,r in rows.items()}
    names_html=(cache/'un-members.html').read_text()
    member_names=[html.unescape(re.sub('<[^>]+>','',v)).strip() for v in re.findall(r'<h2[^>]*>(.*?)</h2>',names_html,re.S)]
    member_names=[n for n in member_names if n!='Search the United Nations']
    assert len(member_names)==193,'Membership page changed; review the parser'
    members={ALIASES.get(n) or names.get(normalize(n)):n for n in member_names}
    assert None not in members and len(members)==193
    observer_html=(cache/'un-observers.html').read_text()
    assert 'Holy See' in observer_html and 'State of Palestine' in observer_html
    observers={'PSE':'State of Palestine','VAT':'Holy See'}
    with zipfile.ZipFile(update) as z:
        with io.TextIOWrapper(z.open('WPP2024_Demographic_Indicators_Medium_Update.csv'),encoding='utf-8-sig') as f:
            revised=[r for r in csv.DictReader(f) if r['Time']=='2024' and r['Variant']=='Medium']
    assert len(revised)==1 and revised[0]['ISO3_code']=='TGO'
    rows['TGO']=revised[0]
    ids=sorted([*members,*observers])
    display=node("const fs=require('fs');const r=JSON.parse(fs.readFileSync(0,'utf8'));const n=new Intl.DisplayNames(['pt-BR'],{type:'region'});process.stdout.write(JSON.stringify(Object.fromEntries(r.map(x=>[x.id,n.of(x.flag)]))));",[{'id':i,'flag':rows[i]['ISO2_code']} for i in ids])
    previous={c['id']:c for c in old['countries']}
    countries=[];excluded=[];registry=[];proof=[]
    for iso in ids:
        row=rows.get(iso);missing=[];values={}
        for key,column in FIELDS.items():
            raw=row.get(column) if row else None
            if raw in (None,'','...','NA','NaN'):missing.append(key);continue
            number=Decimal(raw)
            if not number.is_finite():missing.append(key);continue
            if key=='population':
                number*=1000
                assert number==number.to_integral_value()
                values[key]=int(number)
            else:values[key]=float(number)
        name=previous.get(iso,{}).get('name') or OVERRIDES.get(iso) or display[iso]
        registry.append({'id':iso,'name':name,'unName':members.get(iso) or observers[iso],'wppName':row['Location'] if row else None,'flag':row['ISO2_code'].lower() if row else None,'status':'member' if iso in members else 'observer','complete':not missing,'missing':missing,'available':not missing and iso not in EDITORIAL_EXCLUSIONS})
        if missing:
            excluded.append({'id':iso,'name':name,'missing':missing,'alternative':'Fora do sorteio até validar uma série compatível para os seis indicadores; não preencher com zeros.'});continue
        assert values['population']>0 and 0<values['lifeExpectancy']<130 and 0<=values['fertility']<15 and 0<=values['infantMortality']<=1000 and 0<values['medianAge']<100
        card={'id':iso,'name':name,'flag':row['ISO2_code'].lower(),**values}
        if iso in previous:assert card==previous[iso],f'Previously validated values changed: {iso}'
        proof.append({'id':iso,'source':'interim-update' if iso=='TGO' else 'main-medium','Time':row['Time'],'Variant':row['Variant'],**{col:row[col] for col in FIELDS.values()}})
        if iso in EDITORIAL_EXCLUSIONS:
            excluded.append({'id':iso,'name':name,'type':'editorial','reason':EDITORIAL_EXCLUSIONS[iso]})
            continue
        countries.append(card)
    countries.sort(key=lambda c:normalize(c['name']))
    lists=node("const m=require('./projeto-demografia-ufmg/modes.js');process.stdout.write(JSON.stringify({easy:m.EASY_IDS,normalKnown:m.KNOWN_IDS,normalLessKnown:m.LESS_KNOWN_IDS}));")
    included={c['id'] for c in countries}
    for pool in lists.values():assert set(pool)<=included
    assert len(lists['easy'])==36 and len(lists['normalKnown'])==len(lists['normalLessKnown'])==30
    metadata={**old['metadata'],'retrievedAt':'2026-10-23','sourceUrl':SOURCE,'sourceSha256':digest(original),
      'notes':'2024 values are Medium-scenario projections; estimates end in 2023. Official interim update applied only to Togo. Modelled microstate rates need particular caution.',
      'interimUpdate':{'url':UPDATE,'sha256':digest(update),'countryIds':['TGO'],'reason':'Official correction of a double census adjustment. All six values taken from its 2024 Medium row.'},
      'coverage':{'requestedMembers':193,'requestedObservers':2,'includedMembers':sum(c['id'] in members for c in countries),'includedObservers':sum(c['id'] in observers for c in countries),'countries':len(countries),'values':6*len(countries),'excluded':excluded},
      'membershipSources':[{'url':'https://www.un.org/en/about-us/member-states','sha256':digest(cache/'un-members.html')},{'url':'https://www.un.org/en/about-us/non-member-states','sha256':digest(cache/'un-observers.html')}],
    }
    dataset={'metadata':metadata,'countries':countries}
    target=SITE/'data';target.mkdir(exist_ok=True)
    (target/'countries.json').write_text(json.dumps(dataset,ensure_ascii=False,indent=2)+'\n')
    (target/'countries.js').write_text('// Generated from countries.json by scripts/import-data.py.\nwindow.DEMOGRAPHY_DATA = '+json.dumps(dataset,ensure_ascii=False,separators=(',',':'))+';\n')
    with (target/'countries.csv').open('w',encoding='utf-8',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=['id','name','flag',*FIELDS]);writer.writeheader();writer.writerows(countries)
    fixtures=ROOT/'scripts/fixtures'
    (fixtures/'un-register.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n')
    with (fixtures/'wpp-2024-source-rows.csv').open('w',encoding='utf-8',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=['id','source','Time','Variant',*FIELDS.values()]);writer.writeheader();writer.writerows(proof)
    (ROOT/'qa/coverage.json').write_text(json.dumps({'metadata':metadata,'registry':registry,'modeLists':lists},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(metadata['coverage'],ensure_ascii=False))

if __name__=='__main__':extract(Path(sys.argv[1]))

"""Build separate local region metadata from the official UNSD M49 HTML.
Usage: python3 scripts/import-geography.py /path/to/m49-overview.html
Does not modify any demographic indicator or country identity.
"""
from pathlib import Path
import csv,hashlib,html,json,re,sys
ROOT=Path(__file__).resolve().parents[1]
SOURCE='https://unstats.un.org/unsd/methodology/m49/overview/'
LABELS={'002':'África','019':'Américas','142':'Ásia','150':'Europa','009':'Oceania'}
def build(path):
 raw=path.read_bytes();page=raw.decode('utf-8-sig')
 table=re.search(r'<table\b[^>]*id\s*=\s*"downloadTableEN"[^>]*>(.*?)</table>',page,re.S).group(1)
 rows=[]
 for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>',re.sub(r'<!--.*?-->','',table,flags=re.S),re.S):
  cells=[html.unescape(re.sub(r'<[^>]*>','',s)).strip() for s in re.findall(r'<td\b[^>]*>(.*?)</td>',row,re.S)]
  if len(cells)==15 and re.fullmatch('[A-Z]{3}',cells[11]):rows.append(cells)
 lookup={r[11]:r for r in rows};countries=json.loads((ROOT/'projeto-demografia-ufmg/data/countries.json').read_text())['countries']
 assert len(lookup)>=248
 records={};proof=[]
 for country in countries:
  row=lookup[country['id']];assert row[2] in LABELS and row[10].lower()==country['flag']
  records[country['id']]=row[2]
  proof.append({'id':country['id'],'m49':row[9],'iso2':row[10],'regionCode':row[2],'regionName':row[3],'subregionCode':row[4],'subregionName':row[5]})
 data={'source':SOURCE,'sourceSha256':hashlib.sha256(raw).hexdigest(),'retrievedAt':'2026-10-23','regions':LABELS,'countryRegions':records}
 target=ROOT/'projeto-demografia-ufmg/data'
 (target/'geography.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 (target/'geography.js').write_text('// Separate geographic metadata; demographic data are unchanged.\nwindow.DEMOGRAPHY_GEOGRAPHY = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
 with (ROOT/'scripts/fixtures/m49-regions.csv').open('w',encoding='utf-8',newline='') as f:
  writer=csv.DictWriter(f,fieldnames=list(proof[0]));writer.writeheader();writer.writerows(proof)
 print(json.dumps({label:sum(code==v for v in records.values()) for code,label in LABELS.items()},ensure_ascii=False))
if __name__=='__main__':build(Path(sys.argv[1]))

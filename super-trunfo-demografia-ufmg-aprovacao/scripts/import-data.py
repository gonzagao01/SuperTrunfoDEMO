"""Extract the 36 requested countries from the official WPP 2024 bulk file.

Usage: python3 scripts/import-data.py /path/to/WPP2024_Demographic_Indicators_Medium.csv.gz
The source file is deliberately not required to play the game.
"""
import csv
import gzip
import hashlib
import json
import sys
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = "https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_Demographic_Indicators_Medium.csv.gz"
COUNTRIES = [
    ("BRA", "br", "Brasil"), ("RUS", "ru", "Rússia"),
    ("CHN", "cn", "China"), ("IND", "in", "Índia"),
    ("JPN", "jp", "Japão"), ("USA", "us", "Estados Unidos"),
    ("ESP", "es", "Espanha"), ("ERI", "er", "Eritreia"),
    ("YEM", "ye", "Iêmen"), ("AUS", "au", "Austrália"),
    ("MEX", "mx", "México"), ("NGA", "ng", "Nigéria"),
    ("KEN", "ke", "Quênia"), ("ARG", "ar", "Argentina"),
    ("HTI", "ht", "Haiti"), ("DEU", "de", "Alemanha"),
    ("IDN", "id", "Indonésia"), ("AFG", "af", "Afeganistão"),
    ("FRA", "fr", "França"), ("KGZ", "kg", "Quirguistão"),
    ("MLI", "ml", "Mali"), ("MWI", "mw", "Malawi"),
    ("ZAF", "za", "África do Sul"), ("ISL", "is", "Islândia"),
    ("CAN", "ca", "Canadá"), ("CHL", "cl", "Chile"),
    ("NOR", "no", "Noruega"), ("PRT", "pt", "Portugal"),
    ("KOR", "kr", "Coreia do Sul"), ("BGD", "bd", "Bangladesh"),
    ("PAK", "pk", "Paquistão"), ("PHL", "ph", "Filipinas"),
    ("TUR", "tr", "Turquia"), ("EGY", "eg", "Egito"),
    ("ETH", "et", "Etiópia"), ("NZL", "nz", "Nova Zelândia"),
]
FIELDS = {"population": "TPopulation1July", "lifeExpectancy": "LEx",
          "fertility": "TFR", "infantMortality": "IMR",
          "netMigration": "CNMR", "medianAge": "MedianAgePop"}

def extract(source):
    selected = {}
    wanted = {iso for iso, _, _ in COUNTRIES}
    with gzip.open(source, "rt", encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream):
            if row["ISO3_code"] in wanted and row["Time"] == "2024" and row["Variant"] == "Medium":
                assert row["ISO3_code"] not in selected, "Duplicate country-year"
                selected[row["ISO3_code"]] = row
    assert len(selected) == len(COUNTRIES), "Missing country data"
    countries = []
    for iso, flag, name in COUNTRIES:
        row = selected[iso]
        values = {}
        for key, column in FIELDS.items():
            assert row[column] not in ("", "...", "NA"), f"Missing {name}: {column}"
            raw = Decimal(row[column])
            values[key] = int(raw * 1000) if key == "population" else float(raw)
        countries.append({"id": iso, "name": name, "flag": flag, **values})
    metadata = {
        "title": "World Population Prospects 2024", "publisher": "United Nations, DESA, Population Division",
        "revision": 2024, "year": 2024, "variant": "Medium", "status": "projection",
        "referenceDate": "2024-07-01 (population and median age); calendar year 2024 (rates)",
        "retrievedAt": "2026-10-22", "sourceUrl": SOURCE,
        "sourcePage": "https://population.un.org/wpp/", "sourceSha256": hashlib.sha256(Path(source).read_bytes()).hexdigest(),
        "license": "CC BY 3.0 IGO", "columns": FIELDS,
        "units": {"population": "habitantes", "lifeExpectancy": "anos", "fertility": "filhos por mulher",
                  "infantMortality": "óbitos antes de 1 ano por mil nascidos vivos",
                  "netMigration": "migrantes líquidos por mil habitantes", "medianAge": "anos"},
        "transformations": ["TPopulation1July: thousands of people multiplied by 1000; all other values retained at source precision."],
        "notes": "2024 values are medium-scenario projections in this revision; historical estimates end in 2023."
    }
    dataset = {"metadata": metadata, "countries": countries}
    target = ROOT / "data"
    target.mkdir(parents=True, exist_ok=True)
    (target / "countries.json").write_text(json.dumps(dataset, ensure_ascii=False, indent=2) + "\n")
    (target / "countries.js").write_text("// Generated from countries.json by scripts/import-data.py.\nwindow.DEMOGRAPHY_DATA = " + json.dumps(dataset, ensure_ascii=False, separators=(",", ":")) + ";\n")
    with (target / "countries.csv").open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=["id", "name", "flag", *FIELDS])
        writer.writeheader()
        writer.writerows(countries)
    print(f"Validated and exported {len(countries)} countries, {len(countries) * len(FIELDS)} values. Source SHA256: {metadata['sourceSha256']}")

if __name__ == "__main__":
    extract(sys.argv[1])

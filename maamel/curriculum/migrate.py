"""Create a small review DB or extend a separate SQLite copy of the prior inventory."""
import argparse
import csv
import json
import sqlite3
from contextlib import closing
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SHA = "2190b1c54f441e7b4d19152cebb6d32c30848afc5666ccf22bb8a686acbd0319"


def rows(name):
    with (ROOT / name).open(encoding="utf-8") as handle:
        return list(csv.DictReader(handle, delimiter="\t"))


def sync(db, table, fields, values, key):
    # Identifiers come only from the static calls in this module.
    updates = [f"{column}=excluded.{column}" for column in fields if column not in key]
    action = "DO UPDATE SET " + ",".join(updates) if updates else "DO NOTHING"
    db.execute(f"INSERT INTO {table} ({','.join(fields)}) VALUES ({','.join('?' for _ in fields)}) "
               f"ON CONFLICT({','.join(key)}) {action}", values)


def import_review(db):
    notes = {int(page): note for page, note in
             (line.split("\t", 1) for line in (ROOT / "page-review.tsv").read_text().splitlines())}
    if sorted(notes) != list(range(1, 318)):
        raise ValueError("Incomplete grade 4 page review")
    lessons = json.loads((ROOT / "lessons.json").read_text())
    units = {}
    db.execute("INSERT OR IGNORE INTO ma_source VALUES (1, ?)", (SHA,))
    if db.execute("SELECT pdf_sha256 FROM ma_source WHERE book_id=1").fetchone()[0] != SHA:
        raise ValueError("Existing review is for a different source edition")
    for page, note in notes.items():
        sync(db, "ma_page", ["book_id","page","visual_note"], (1,page,note), ["book_id","page"])
    extras = [dict(id=r["id"], title=r["kind"], kind=r["kind"], unit=r["unit"],
                   part="الأول" if int(r["first"])<170 else "الثاني",
                   first_page=int(r["first"]), last_page=int(r["last"])) for r in rows("sections.tsv")]
    for item in lessons + extras:
        unit = units.setdefault(item["unit"], f"G4-U{len(units)+1:02}")
        sync(db,"ma_unit",["id","book_id","title","part"],(unit,1,item["unit"],item["part"]),["id"])
        sync(db,"ma_section",["id","unit_id","title","kind","first_page","last_page"],
             (item["id"],unit,item["title"],item.get("kind","درس"),item["first_page"],item["last_page"]),["id"])
        for page in range(item["first_page"],item["last_page"]+1):
            db.execute("INSERT OR IGNORE INTO ma_section_page VALUES (?,?,?)",(item["id"],1,page))
    for row in rows("skills.tsv"):
        section, page, program = row["lesson"], int(row["page"]), row["environment"]
        stem = f"{section}-P{page:03}"
        skill, req, activity, test = (f"{stem}-{s}" for s in ["SK","REQ","ACT","TEST"])
        sync(db,"ma_skill",["id","section_id","book_id","page","title","concepts"],
             (skill,section,1,page,row["skill"],row["concepts"]),["id"])
        db.execute("INSERT OR IGNORE INTO ma_program VALUES (?)",(program,))
        db.execute("""INSERT INTO ma_requirement VALUES (?,?,?,?,?) ON CONFLICT(id)
                      DO UPDATE SET skill_id=excluded.skill_id,program=excluded.program,
                      description=excluded.description""",(req,skill,program,notes[page],"تم التحقق من المصدر"))
        sync(db,"ma_activity",["id","requirement_id","task"],(activity,req,row["skill"]),["id"])
        sync(db,"ma_acceptance",["id","activity_id","criterion"],(test,activity,row["acceptance"]),["id"])


def build(target, inventory=None):
    if inventory and target.resolve() == inventory.resolve():
        raise ValueError("Choose a separate output path")
    if inventory and (not inventory.is_file() or target.exists()):
        raise ValueError("Supply an existing inventory and a new destination")
    with closing(sqlite3.connect(target)) as db:
        if inventory:
            with closing(sqlite3.connect(inventory.as_uri() + "?mode=ro",uri=True)) as source:
                source.backup(db)
        db.execute("PRAGMA foreign_keys=ON")
        if not db.execute("SELECT 1 FROM sqlite_master WHERE name='books'").fetchone():
            db.executescript("CREATE TABLE books(id INTEGER PRIMARY KEY,grade TEXT,filename TEXT,pages INTEGER);"
                             "CREATE TABLE pages(book_id INTEGER,page INTEGER,PRIMARY KEY(book_id,page));")
            db.execute("INSERT INTO books VALUES (1,?,?,317)",("الرابع الابتدائي","رابع .pdf"))
            db.executemany("INSERT INTO pages VALUES (1,?)",[(i,) for i in range(1,318)])
        if db.execute("SELECT grade,pages FROM books WHERE id=1").fetchone()!=("الرابع الابتدائي",317):
            raise ValueError("Inventory edition or IDs differ")
        if db.execute("SELECT page FROM pages WHERE book_id=1 ORDER BY page").fetchall()!=[(i,) for i in range(1,318)]:
            raise ValueError("Inventory source pages missing")
        db.executescript((ROOT/"schema.sql").read_text())
        with db:
            import_review(db)
            errors = db.execute("PRAGMA foreign_key_check").fetchall()
            if errors:
                raise ValueError(errors)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--inventory", type=lambda p: Path(p).resolve())
    args = parser.parse_args()
    build(args.output, args.inventory)

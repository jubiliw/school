"""Import a completed run-acceptance.mjs JSON file; preserve older runs."""
import argparse
import json
import sqlite3
from contextlib import closing
from pathlib import Path


def apply(db, evidence):
    if evidence["version"] != 1:
        raise ValueError("Unrecognized evidence format")
    for item in evidence["results"]:
        acceptance = item["acceptance"]
        row = db.execute(
            """SELECT r.id,s.page FROM ma_acceptance t JOIN ma_activity a ON a.id=t.activity_id
               JOIN ma_requirement r ON r.id=a.requirement_id JOIN ma_skill s ON s.id=r.skill_id
               WHERE t.id=? AND a.id=?""", (acceptance,item["activity"])).fetchone()
        if not row or row[1] != item["sourcePage"]:
            raise ValueError(f"Unmatched source evidence: {acceptance}")
        if db.execute("""SELECT 1 FROM ma_run r JOIN ma_task_evidence e ON e.run_id=r.id
                         WHERE r.acceptance_id=? AND r.ran_at=? AND e.code_sha256=?""",
                      (acceptance,evidence["ranAt"],evidence["codeSha256"])).fetchone():
            continue
        label = f'{item["lab"]}/{item["task"]} | backend/index.mjs, local SQLite, {evidence["node"]}'
        cursor = db.execute("INSERT INTO ma_run(acceptance_id,ran_at,passed,evidence) VALUES (?,?,1,?)",
                            (acceptance,evidence["ranAt"],label))
        db.execute("INSERT INTO ma_task_evidence VALUES (?,?,?,?,?,?,?,?)",
                   (cursor.lastrowid,item["lab"],item["task"],evidence["codeSha256"],
                    item["incorrect"],item["correct"],item["teacher"],item["attempts"]))
        db.execute("UPDATE ma_requirement SET status='اجتاز الاختبار' WHERE id=?", (row[0],))


if __name__ == "__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database", type=Path)
    parser.add_argument("evidence", type=Path)
    args=parser.parse_args()
    with closing(sqlite3.connect(args.database.resolve().as_uri()+"?mode=rw",uri=True)) as db:
        db.execute("PRAGMA foreign_keys=ON")
        with db:
            apply(db,json.loads(args.evidence.read_text()))

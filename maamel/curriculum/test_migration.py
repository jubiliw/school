import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from migrate import build


class MigrationTest(unittest.TestCase):
    def test_resume_and_evidence(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "grade4.sqlite"
            build(path)
            with closing(sqlite3.connect(path)) as db:
                self.assertEqual(db.execute("SELECT count(*) FROM ma_page").fetchone()[0], 317)
                self.assertEqual(db.execute("SELECT count(*) FROM ma_section WHERE kind='درس'").fetchone()[0], 27)
                self.assertEqual(db.execute("SELECT count(*) FROM ma_section WHERE id LIKE 'G4-P%'").fetchone()[0], 8)
                self.assertEqual(db.execute("SELECT count(*) FROM ma_run").fetchone()[0], 0)
                identifier = db.execute("SELECT id FROM ma_requirement ORDER BY id LIMIT 1").fetchone()[0]
                with self.assertRaises(sqlite3.IntegrityError):
                    db.execute("UPDATE ma_requirement SET status='اجتاز الاختبار' WHERE id=?", (identifier,))
                db.execute("UPDATE ma_requirement SET status='قيد التطوير' WHERE id=?", (identifier,))
                db.commit()
            build(path)
            with closing(sqlite3.connect(path)) as db:
                self.assertEqual(db.execute("SELECT status FROM ma_requirement WHERE id=?", (identifier,)).fetchone()[0], "قيد التطوير")
                self.assertEqual(db.execute("PRAGMA foreign_key_check").fetchall(), [])


if __name__ == "__main__":
    unittest.main()

CREATE TABLE IF NOT EXISTS ma_source (
 book_id INTEGER PRIMARY KEY REFERENCES books(id),
 pdf_sha256 TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS ma_unit (
 id TEXT PRIMARY KEY, book_id INTEGER NOT NULL REFERENCES ma_source(book_id),
 title TEXT NOT NULL, part TEXT NOT NULL, UNIQUE(book_id,title)
);
CREATE TABLE IF NOT EXISTS ma_section (
 id TEXT PRIMARY KEY, unit_id TEXT NOT NULL REFERENCES ma_unit(id),
 title TEXT NOT NULL, kind TEXT NOT NULL, first_page INTEGER NOT NULL,
 last_page INTEGER NOT NULL CHECK(last_page >= first_page)
);
CREATE TABLE IF NOT EXISTS ma_page (
 book_id INTEGER NOT NULL, page INTEGER NOT NULL, visual_note TEXT NOT NULL,
 PRIMARY KEY(book_id,page), FOREIGN KEY(book_id,page) REFERENCES pages(book_id,page)
);
CREATE TABLE IF NOT EXISTS ma_section_page (
 section_id TEXT NOT NULL REFERENCES ma_section(id), book_id INTEGER NOT NULL, page INTEGER NOT NULL,
 PRIMARY KEY(section_id,book_id,page), FOREIGN KEY(book_id,page) REFERENCES ma_page(book_id,page)
);
CREATE TABLE IF NOT EXISTS ma_skill (
 id TEXT PRIMARY KEY, section_id TEXT NOT NULL, book_id INTEGER NOT NULL, page INTEGER NOT NULL,
 title TEXT NOT NULL, concepts TEXT NOT NULL,
 FOREIGN KEY(section_id,book_id,page) REFERENCES ma_section_page(section_id,book_id,page)
);
CREATE TABLE IF NOT EXISTS ma_program (name TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS ma_requirement (
 id TEXT PRIMARY KEY, skill_id TEXT NOT NULL REFERENCES ma_skill(id),
 program TEXT NOT NULL REFERENCES ma_program(name), description TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('مستخرج','تم التحقق من المصدر','معتمد للتحويل البرمجي','قيد التطوير','منفذ','اجتاز الاختبار','يحتاج إصلاحًا'))
);
CREATE TABLE IF NOT EXISTS ma_activity (
 id TEXT PRIMARY KEY, requirement_id TEXT NOT NULL REFERENCES ma_requirement(id), task TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ma_acceptance (
 id TEXT PRIMARY KEY, activity_id TEXT NOT NULL REFERENCES ma_activity(id), criterion TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ma_run (
 id INTEGER PRIMARY KEY, acceptance_id TEXT NOT NULL REFERENCES ma_acceptance(id),
 ran_at TEXT NOT NULL, passed INTEGER NOT NULL CHECK(passed IN (0,1)), evidence TEXT NOT NULL CHECK(length(trim(evidence))>0)
);
CREATE TRIGGER IF NOT EXISTS ma_prove_tested BEFORE UPDATE OF status ON ma_requirement
WHEN NEW.status='اجتاز الاختبار' AND EXISTS (
 SELECT 1 FROM ma_activity a JOIN ma_acceptance t ON t.activity_id=a.id
 WHERE a.requirement_id=NEW.id AND COALESCE((SELECT passed FROM ma_run WHERE acceptance_id=t.id ORDER BY id DESC LIMIT 1),0)=0
)
BEGIN SELECT RAISE(ABORT,'A passing run is required for every criterion'); END;
CREATE TRIGGER IF NOT EXISTS ma_prove_exists BEFORE UPDATE OF status ON ma_requirement
WHEN NEW.status='اجتاز الاختبار' AND NOT EXISTS (
 SELECT 1 FROM ma_activity a JOIN ma_acceptance t ON t.activity_id=a.id WHERE a.requirement_id=NEW.id
)
BEGIN SELECT RAISE(ABORT,'No acceptance criterion'); END;
CREATE TABLE IF NOT EXISTS ma_task_evidence (
 run_id INTEGER PRIMARY KEY REFERENCES ma_run(id),
 lab TEXT NOT NULL, task TEXT NOT NULL, code_sha256 TEXT NOT NULL CHECK(length(code_sha256)=64),
 incorrect_score INTEGER NOT NULL CHECK(incorrect_score BETWEEN 0 AND 99),
 correct_score INTEGER NOT NULL CHECK(correct_score=100), teacher_score INTEGER NOT NULL CHECK(teacher_score=100),
 attempts INTEGER NOT NULL CHECK(attempts=2)
);

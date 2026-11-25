PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS users(
 id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('teacher','student','admin')),
 passwordHash TEXT NOT NULL, salt TEXT NOT NULL, createdAt TEXT NOT NULL, suspended INTEGER NOT NULL DEFAULT 0 CHECK(suspended IN (0,1))
);
CREATE TABLE IF NOT EXISTS sessions(
 token TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users ON DELETE CASCADE, expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_by_expiry ON sessions(expires);
CREATE TABLE IF NOT EXISTS auth_limits(
 bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, untilTime INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS classes(
 id TEXT PRIMARY KEY, teacherId TEXT NOT NULL REFERENCES users ON DELETE CASCADE,
 name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS classes_by_owner ON classes(teacherId);
CREATE TABLE IF NOT EXISTS members(
 classId TEXT NOT NULL REFERENCES classes ON DELETE CASCADE, studentId TEXT NOT NULL REFERENCES users ON DELETE CASCADE,
 PRIMARY KEY(classId,studentId)
);
CREATE INDEX IF NOT EXISTS classes_by_member ON members(studentId);
CREATE TABLE IF NOT EXISTS assignments(
 id TEXT PRIMARY KEY, classId TEXT NOT NULL REFERENCES classes ON DELETE CASCADE, title TEXT NOT NULL,
 lab TEXT NOT NULL, task TEXT NOT NULL, dueAt TEXT, createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS assignments_by_class ON assignments(classId,createdAt);
CREATE TABLE IF NOT EXISTS work(
 assignmentId TEXT NOT NULL REFERENCES assignments ON DELETE CASCADE,
 studentId TEXT NOT NULL REFERENCES users ON DELETE CASCADE,
 state TEXT NOT NULL, version INTEGER NOT NULL, status TEXT NOT NULL CHECK(status IN ('draft','submitted','reopened')),
 score REAL, feedback TEXT, updatedAt TEXT NOT NULL, reopened INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(assignmentId,studentId)
);
CREATE TABLE IF NOT EXISTS attempts(
 assignmentId TEXT NOT NULL REFERENCES assignments ON DELETE CASCADE,
 studentId TEXT NOT NULL REFERENCES users ON DELETE CASCADE,
 version INTEGER NOT NULL, score REAL NOT NULL, feedback TEXT NOT NULL, state TEXT NOT NULL, submittedAt TEXT NOT NULL,
 PRIMARY KEY(assignmentId,studentId,version)
);
CREATE TRIGGER IF NOT EXISTS attempt_created AFTER INSERT ON work WHEN NEW.status='submitted'
BEGIN
 INSERT INTO attempts VALUES(NEW.assignmentId,NEW.studentId,NEW.version,NEW.score,NEW.feedback,NEW.state,NEW.updatedAt);
END;
CREATE TRIGGER IF NOT EXISTS attempt_updated AFTER UPDATE ON work WHEN NEW.status='submitted' AND NEW.version!=OLD.version
BEGIN
 INSERT INTO attempts VALUES(NEW.assignmentId,NEW.studentId,NEW.version,NEW.score,NEW.feedback,NEW.state,NEW.updatedAt);
END;
CREATE TABLE IF NOT EXISTS audit(
 id INTEGER PRIMARY KEY, actor TEXT REFERENCES users ON DELETE SET NULL, action TEXT NOT NULL,
 target TEXT NOT NULL, createdAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS schools(id TEXT PRIMARY KEY,name TEXT NOT NULL,retentionDays INTEGER CHECK(retentionDays IS NULL OR retentionDays BETWEEN 1 AND 3650));
CREATE TABLE IF NOT EXISTS school_staff(
 schoolId TEXT NOT NULL REFERENCES schools ON DELETE CASCADE,teacherId TEXT NOT NULL UNIQUE REFERENCES users ON DELETE CASCADE,
 PRIMARY KEY(schoolId,teacherId)
);
CREATE TABLE IF NOT EXISTS subscriptions(
 id TEXT PRIMARY KEY, ownerId TEXT REFERENCES users ON DELETE CASCADE, schoolId TEXT REFERENCES schools ON DELETE CASCADE,
 plan TEXT NOT NULL CHECK(plan IN ('teacher','school','institution')), status TEXT NOT NULL CHECK(status IN ('trial','active','expired')),
 validUntil TEXT, classLimit INTEGER NOT NULL CHECK(classLimit>=0), CHECK((ownerId IS NULL)!=(schoolId IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS one_school_plan ON subscriptions(schoolId) WHERE schoolId IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS one_teacher_plan ON subscriptions(ownerId) WHERE ownerId IS NOT NULL;
CREATE TRIGGER IF NOT EXISTS class_created AFTER INSERT ON classes
BEGIN
 INSERT INTO audit(actor,action,target,createdAt) VALUES(NEW.teacherId,'class.create',NEW.id,NEW.createdAt);
END;
CREATE TRIGGER IF NOT EXISTS assignment_reopened AFTER UPDATE ON work WHEN OLD.status='submitted' AND NEW.status='reopened'
BEGIN
 INSERT INTO audit(actor,action,target,createdAt)
 SELECT c.teacherId,'assignment.reopen',a.id||':'||NEW.studentId,NEW.updatedAt FROM assignments a JOIN classes c ON c.id=a.classId WHERE a.id=NEW.assignmentId;
END;
CREATE TRIGGER IF NOT EXISTS attempt_audited AFTER INSERT ON attempts
BEGIN
 INSERT INTO audit(actor,action,target,createdAt) VALUES(NEW.studentId,'assignment.submit',NEW.assignmentId,NEW.submittedAt);
END;
CREATE INDEX IF NOT EXISTS works_by_update ON work(updatedAt);
CREATE TRIGGER IF NOT EXISTS delete_work_attempts AFTER DELETE ON work
BEGIN
 DELETE FROM attempts WHERE assignmentId=OLD.assignmentId AND studentId=OLD.studentId;
END;
CREATE TABLE IF NOT EXISTS class_settings(classId TEXT PRIMARY KEY REFERENCES classes ON DELETE CASCADE, programs TEXT);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS join_requests(classId TEXT NOT NULL REFERENCES classes ON DELETE CASCADE,studentId TEXT NOT NULL REFERENCES users ON DELETE CASCADE,PRIMARY KEY(classId,studentId));

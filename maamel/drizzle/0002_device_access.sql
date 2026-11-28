CREATE TABLE class_devices (
 studentId TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 classId TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE work ADD COLUMN extendedUntil TEXT;

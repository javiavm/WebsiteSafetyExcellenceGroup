const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'seg.db');
const db = new sqlite3.Database(dbPath);

const migrations = [
    'schema.sql',
    'migrations/tools-v3.sql',
    'migrations/users.sql'
];

db.serialize(() => {
    for (const file of migrations) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const sql = fs.readFileSync(filePath, 'utf8');
            // Split by semicolons and run each statement separately
            const statements = sql.split(';').filter(s => s.trim());
            for (const stmt of statements) {
                if (stmt.trim()) {
                    db.run(stmt + ';', (err) => {
                        if (err && !err.message.includes('duplicate column')) {
                            console.log(`Note: ${err.message}`);
                        }
                    });
                }
            }
            console.log(`✓ ${file}`);
        }
    }
});

db.close(() => {
    console.log('\nAll migrations completed!');
});

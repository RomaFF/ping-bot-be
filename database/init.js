const db = require('../config/database');

const ADMINISTRATORS = [
    { telegram_id: process.env.USER_ID, chat_id: process.env.USER_ID, username: 'admin1' },
];

function initDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    telegram_id INTEGER UNIQUE NOT NULL,
                    chat_id INTEGER NOT NULL,
                    role TEXT DEFAULT 'CLIENT' CHECK(role IN ('ADMINISTRATOR', 'CLIENT')),
                    username TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating users table:', err);
                    return reject(err);
                }
                console.log('The users table has been created');
            });

            db.run(`
                CREATE TABLE IF NOT EXISTS pings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    telegram_id INTEGER NOT NULL,
                    chat_id INTEGER NOT NULL,
                    user_role TEXT NOT NULL,
                    ping_data TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating pings table:', err);
                    return reject(err);
                }
                console.log('Pings table created');
            });

            const insertAdmin = db.prepare(`
                INSERT OR IGNORE INTO users (telegram_id, chat_id, role, username) 
                VALUES (?, ?, 'ADMINISTRATOR', ?)
            `);

            ADMINISTRATORS.forEach((admin) => {
                insertAdmin.run([admin.telegram_id, admin.chat_id, admin.username], (err) => {
                    if (err) {
                        console.error('Error adding administrator:', err);
                    } else {
                        console.log(`Administrator ${admin.username} added`);
                    }
                });
            });

            insertAdmin.finalize();
            resolve();
        });
    });
}

module.exports = { initDatabase, ADMINISTRATORS };
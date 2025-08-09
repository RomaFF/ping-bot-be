const db = require('../config/database');

class User {
    static getById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static getByTelegramId(telegramId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static getByChatId(chatId) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE chat_id = ?', [chatId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static create(telegramId, chatId, role = 'CLIENT', username = null) {
        return new Promise((resolve, reject) => {
            const stmt = db.prepare(`
                INSERT INTO users (telegram_id, chat_id, role, username) 
                VALUES (?, ?, ?, ?)
            `);

            stmt.run([telegramId, chatId, role, username], function(err) {
                if (err) {
                    reject(err);
                } else {
                    User.getById(this.lastID)
                        .then(resolve)
                        .catch(reject);
                }
            });
            stmt.finalize();
        });
    }

    static getOrCreate(telegramId, chatId, role = 'CLIENT', username = null) {
        return new Promise(async (resolve, reject) => {
            try {
                let user = await User.getByTelegramId(telegramId);

                if (user) {
                    if (user.chat_id !== chatId) {
                        await User.updateChatId(telegramId, chatId);
                        user.chat_id = chatId;
                    }
                    resolve(user);
                } else {
                    user = await User.create(telegramId, chatId, role, username);
                    resolve(user);
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    static updateChatId(telegramId, chatId) {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE users SET chat_id = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?',
                [chatId, telegramId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    static getAdministrators() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM users WHERE role = ?', ['ADMINISTRATOR'], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static updateRole(telegramId, role) {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?',
                [role, telegramId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }
}

module.exports = User;
const db = require('../config/database');

class Ping {
    static create(userId, telegramId, chatId, userRole, pingData = null) {
        return new Promise((resolve, reject) => {
            const stmt = db.prepare(`
                INSERT INTO pings (user_id, telegram_id, chat_id, user_role, ping_data) 
                VALUES (?, ?, ?, ?, ?)
            `);

            stmt.run([userId, telegramId, chatId, userRole, JSON.stringify(pingData)], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        user_id: userId,
                        telegram_id: telegramId,
                        chat_id: chatId,
                        user_role: userRole,
                        ping_data: pingData,
                        created_at: new Date().toISOString()
                    });
                }
            });
            stmt.finalize();
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM pings ORDER BY created_at DESC', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static getByUserId(userId) {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM pings WHERE user_id = ? ORDER BY created_at DESC',
                [userId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    static getStats() {
        return new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    COUNT(*) as total_pings,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(CASE WHEN user_role = 'ADMINISTRATOR' THEN 1 END) as admin_pings,
                    COUNT(CASE WHEN user_role = 'CLIENT' THEN 1 END) as client_pings
                FROM pings 
                WHERE DATE(created_at) = DATE('now')
            `, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
}

module.exports = Ping;
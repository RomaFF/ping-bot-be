require('dotenv').config();

const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const { initDatabase } = require('./database/init');
const User = require('./models/User');
const Ping = require('./models/Ping');

const PORT = 8000;
const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL;

if (!token) {
    console.error('Bot is unavailable');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(express.json());
app.use(cors());

async function notifyAdministrators(userInfo, pingEvent) {
    try {
        const administrators = await User.getAdministrators();

        const message = `🔔 Ping request received!
        
🚀 User ID: ${userInfo.telegram_id}
💬 Chat ID: ${userInfo.chat_id}
🧑‍💼 Role: ${userInfo.role}
🕒 Time: ${new Date(pingEvent.created_at)}
📎 Event ID: ${pingEvent.id}`;

        for (const admin of administrators) {
            try {
                await bot.sendMessage(admin.chat_id, message);
                console.log(`Notification sent to administrator: ${admin.telegram_id}`);
            } catch (error) {
                console.error(`Error sending notification to administrator ${admin.telegram_id}:`, error);
            }
        }
    } catch (error) {
        console.error('Error sending notification to administrator:', error);
    }
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const username = msg.from.username;

    const user = await User.getByChatId(chatId);

    if (msg.text === '/stats' && user.role === "ADMINISTRATOR") {
        try {
            const stats = await Ping.getStats();
            const message = `📊 Statisctics for today:
            
🎯 Total pings: ${stats.total_pings}
👥 Unique users: ${stats.unique_users}
👑 Pings from admins: ${stats.admin_pings}
👤 Pings from clients: ${stats.client_pings}`;

            await bot.sendMessage(chatId, message);
        } catch (error) {
            console.error('Error getting statistics:', error);
            await bot.sendMessage(chatId, '❌ Error getting statistics.');
        }
    }

    if (user.role === "ADMINISTRATOR") return await bot.sendMessage(chatId, "No no no my friend you can't do that! Just wait for ping!")

    if (msg.text === '/start') {
        try {
            await User.getOrCreate(telegramId, chatId, 'CLIENT', username);

            await bot.sendMessage(chatId, 'Hello, My friend! Click the button below to send ping to admin, please!', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Ping',
                                web_app: { url: webAppUrl }
                            }
                        ]
                    ]
                }
            });
        } catch (error) {
            console.error('Error in /start:', error);
            await bot.sendMessage(chatId, 'Something went wrong. Please, try again later.');
        }
    } else if (msg.text === '/admin') {
        try {
            await User.updateRole(telegramId, 'ADMINISTRATOR');
            await bot.sendMessage(chatId, '✅ You are admin now!');
        } catch (error) {
            console.error('Error assigning administrator.', error);
            await bot.sendMessage(chatId, '❌ Error assigning administrator.');
        }
    } else {
        await bot.sendMessage(chatId, 'You sent me wrong text, my friend. \nPlease, write: \n/start - to make a Ping! \n/stats - to get statistics (admins only). \n/admin - to become an admin. ');
    }
});

app.post('/ping', async (req, res) => {
    const { chatId, username, role } = req.body;

    try {
        if (!chatId || !username || !role) {
            return res.status(400).json({ error: 'Missing user info or chatId' });
        }

        let user = await User.getByChatId(chatId);

        if (!user) {
            user = await User.create(chatId, chatId,username, role);
        }

        const pingEvent = await Ping.create(
            user.id,
            user.telegram_id,
            user.chat_id,
            user.role,
            req.body
        );

        await notifyAdministrators(user, pingEvent);

        await bot.sendMessage(chatId, 'Hello, I am admin! I will be back soon!');

        res.json({
            success: true,
            message: 'Ping received and recorded',
            eventId: pingEvent.id,
            userRole: user.role
        });

    } catch (error) {
        console.error('❌ Error in /ping:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/stats', async (req, res) => {
    try {
        const stats = await Ping.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

initDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log('📁 Database file: database/ping_bot.db');
        });
    })
    .catch(err => {
        console.error('❌ Database initialization error:', err);
        process.exit(1);
    });
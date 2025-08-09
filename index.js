const TelegramBot = require('node-telegram-bot-api');
const express = require('express')
const cors = require('cors')

const token = '8375231427:AAGAIDZD3zIypSlDdX2W2K7bS8sYuieao3k'

const bot = new TelegramBot(token, {polling: true});
const app = express()

app.use(express.json())
app.use(cors())

const webAppUrl = 'https://enchanting-genie-177580.netlify.app/'

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    console.log('msg', msg.text)
    if (msg.text === '/start') {
        await bot.sendMessage(chatId, 'Hello, My friend! Click the button below to send ping to admin, please!', {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Ping',
                            web_app: {url: webAppUrl}
                        }
                    ]
                ]
            }
        });
    } else {
        await bot.sendMessage(chatId, 'You sent me wrong text. Please, write /start')
    }
});

app.post('/ping', async (req, res) => {
    const { info } = req.body

    try {
        await bot.sendMessage(info.chatId, 'Hello, I am admin! I will be back soon!')
    } catch (error) {
        console.log(error)
    }
})

const PORT = 8000

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
require('dotenv').config()
const express = require('express')
const telegram = require('node-telegram-bot-api')
const logger = require('morgan')

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = low(adapter)

const token = process.env.TELEGRAM_TOKEN;
const bot = new telegram(token, {polling: true});

db.defaults({chats: []}).write()

bot.on('message', function (message) {
    const exist = db.get('chats').includes(message.chat.id).value();
    if (!exist) {
        console.log('[telegram]', 'registered chat', message.chat.id)
        db.get('chats').push(message.chat.id).write();
    }
})

const app = express();
app.use(logger('dev'));
app.use(express.json());

app.post("/alert", function (req, res) {
    const chats = db.get('chats').value()
    const labels = req.body.commonLabels || {};
    const message = Object.keys(labels).map(e => `${e}: ${labels[e]}`).join('\n')

    if (!message) {
        console.warn("[alert]", "got empty alert message")
    } else {
        console.log(message);
    }

    chats.forEach(e => {
        console.log("[telegram]", "notifying chat", e);
        bot.sendMessage(e, message);
    });

    res.status(200).json({});
})

app.listen(8080);
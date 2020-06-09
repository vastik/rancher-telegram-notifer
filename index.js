require('dotenv').config();
require('colors');

const express = require('express');
const telegram = require('node-telegram-bot-api');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const lodash = require('lodash')

const adapter = new FileSync(process.env.DATABASE_FILE || 'db.json');
const db = low(adapter);
const token = process.env.TELEGRAM_TOKEN;
const bot = new telegram(token, {polling: true});

db.defaults({chats: []}).write();

bot.on('message', function (message) {
    const exist = db.get('chats').includes(message.chat.id).value();
    if (!exist) {
        console.log('[telegram]'.cyan, 'registered chat', message.chat.id)
        db.get('chats').push(message.chat.id).write();
    }
})

const app = express();
app.use(express.json());

app.post("/alert", function (req, res) {
    const chats = db.get('chats').value()
    const alerts = req.body['alerts'] || []

    alerts.forEach(alert => {
        const labels = alert['labels']
        const message = Object.keys(labels).map(e => `${e}: ${labels[e]}`).join('\n')

        if (message) {
            console.log(`[alert]`.magenta, labels['severity'], labels['alert_type'], labels['alert_name']);
            console.log("[telegram]".bold.cyan, "sending to", chats);
            chats.forEach(e => bot.sendMessage(e, message).catch(ex => console.warn(e, ex.message)));
        }
    })

    res.status(200).json({});
})

app.use("*", (req, res) => res.status(404).json({message: "ENOTFOUND"}));
app.listen(8080);
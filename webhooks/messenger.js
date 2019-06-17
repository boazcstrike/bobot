const Discord = require('discord.js')
const express = require('express')
const bodyParser = require('body-parser')
const { MessengerClient } = require('messaging-api-messenger');

const client = MessengerClient.connect(config.MessengerAccessToken);
const config = require('./config/config.json')

const client = new Discord.Client()
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

client.on('ready', () => {

    app.listen(3000, () => {
        console.log(`Bobot webhook server is listening, port 3000`)
    });

    console.log(`Bobot initiated with ${client.users.size} users in ${client.channels.size} channels.`)
});

client.login(config.DiscordBotToken)
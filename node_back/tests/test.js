const Discord = require('discord.js')
const client = new Discord.Client()

const config = require('../config/config.json')

client.on('ready', () => {
    console.log(client.channels)
})

client.login(config.DiscordBotToken)
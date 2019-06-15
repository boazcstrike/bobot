const Discord = require('discord.js')
const config = require('./config/config.json')

const client = new Discord.Client()

client.on('ready', () => {
  console.log(`Bobot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`)
});

client.on('message', (user, userID, channelID, message, evt) => {
    console.log(user, userID, channelID, message, evt)
})

client.login(config.DiscordBotToken)
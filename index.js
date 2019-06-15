const Discord = require('discord.js')
const config = require('./config/config.json')
var cron = require('node-cron')

const client = new Discord.Client()

// discord commands imports
const cmds = require('./commands/index')

client.on('ready', () => {
  console.log(`Bobot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`)
});


client.on('message', async (message) => {
    try {
        cmds.check(message)
    } catch(err) {
        console.log(err)
    }
})

client.login(config.DiscordBotToken)
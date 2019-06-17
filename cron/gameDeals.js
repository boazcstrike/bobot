const Discord = require('discord.js')
var CronJob = require('cron').CronJob

const config = require('../config/config.json')
const getReddit = require('./_getReddit')

// const gameDealsChannel = config.GameDealsTextChannel
const gameDealsChannel = config.TestTextChannel
const client = new Discord.Client()
const defaultLimit = 5 // default number of post to send
const time = 12 // default hours

client.on('ready', () => {
    console.log(`game deals initiated, will run every ${time} hours.`)
    newNews()
    const gamedealsJob = new CronJob('0 0 */'+time+' * *', function () {
        console.log(`Game deals running every ${time} hours...`)
        newNews()
    })
    gamedealsJob.start()
})

async function newNews() {
    getReddit.getPosts(client, 'GameDeals', 'new', gameDealsChannel, defaultLimit)
    getReddit.getPosts(client, 'FreeGamesOnSteam', 'new', gameDealsChannel, defaultLimit)
}

client.login(config.DiscordBotToken)
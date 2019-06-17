const Discord = require('discord.js')
var CronJob = require('cron').CronJob

const config = require('../config/config.json')
const getReddit = require('./_getReddit')
var gamerChannel = config.TestTextChannel

if (config.env == 'prod') {
    gamerChannel = config.GamerTextChannel
}

const client = new Discord.Client()
const defaultLimit = 5 // default number of post to send
const time = 8 // default hours

client.on('ready', () => {
    console.log(`gamer news initiated, will run every ${time} hours...`)
    // topNews()
    const gamernewsJob = new CronJob('0 0 */'+time+' * *', function () {
        console.log(`running every ${time} hours... ran at ${Date()}`)
        topNews()
    })

    gamernewsJob.start()
});

async function topNews() {
    getReddit.getPosts(client, 'gaming', 'top', gamerChannel, defaultLimit)
    getReddit.getPosts(client, 'GirlGamers', 'top', gamerChannel, defaultLimit)
}

client.login(config.DiscordBotToken)
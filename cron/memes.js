const Discord = require('discord.js')
var CronJob = require('cron').CronJob

const config = require('../config/config.json')
const getReddit = require('./_getReddit')
var memesChannel = config.TestTextChannel

if(config.env == 'prod'){
    memesChannel = config.MemesTextChannel
}

const client = new Discord.Client()

client.on('ready', () => {
    console.log(`meme posts initiated, running every hour.`)
    // getReddit.getTopHourly(client, 'memes', memesChannel)
    const memesJob = new CronJob('0 0 */1 * * *', function () {
        console.log(`Memes running every hour... ran at ${Date()}`)
        getReddit.getTopHourly(client, 'memes', memesChannel)
    })
    memesJob.start()
});

client.login(config.DiscordBotToken)
const Discord = require('discord.js')
var CronJob = require('cron').CronJob

const config = require('../config/config.json')
const { getTopHourly } = require('./_getReddit')

const memesChannel = config.MemesTextChannel
// const memesChannel = config.TestTextChannel
const client = new Discord.Client()

client.on('ready', () => {
    getTopHourly(client, 'memes', memesChannel)

    const memesJob = new CronJob('0 0 */1 * *', function () {
        console.log(`Memes running every hour... running at ` + Date())
        getTopHourly(client, 'memes', memesChannel)
    })

    memesJob.start()
});

client.login(config.DiscordBotToken)
const Discord = require('discord.js')

var CronJob = require('cron').CronJob

const config = require('./config/config.json')

const client = new Discord.Client()

client.on('ready', () => {
    const job = new CronJob('0 0 */8 * * *', function () {
        console.log('running every 8 hours')
        client.channels
        .get(config.DiscordBotInitialTextChannel)
        .send(`Darell Calayag is one of the best engineers and human beings I know.`)
    })
    job.start()
});

client.login(config.DiscordBotToken)
const Discord = require('discord.js')
const axios = require("axios")

var cron = require('node-cron')
var CronJob = require('cron').CronJob

const config = require('./config/config.json')
const redditPostToEmbed = require("./utils/redditPostToEmbed")

const client = new Discord.Client()

const textChannel = config.ServerNewsChannel

client.on('ready', () => {
    console.log(`bobot get game deals cron has started...`)
    getGameDeals()
    getFreeGamesOnSteam()

    const job = new CronJob('0 0 */4 * *', function () {
        console.log(`4th hr, running...`)
        getGameDeals()
        getFreeGamesOnSteam()
    })
    job.start()
});

async function getGameDeals() {
    console.log(`sending r/GameDeals`)
    try {
        let res = await axios.get(`https://www.reddit.com/r/GameDeals/new.json?limit=5&sort=new`)
        const posts = res.data.data.children
        if (posts.length == 0) {
            return client.channels.get(textChannel).send(`Nothing new in **r/GameDeals** :confused: `)
        } else {
            for (const post of posts) {
                const embed = redditPostToEmbed(post)
                client.channels.get(textChannel).send({ embed })
            }
        }
    } catch (err) {
        return err
    }
}

async function getFreeGamesOnSteam() {
    console.log(`sending and r/FreeGamesOnSteam...`)
    try {
        let res = await axios.get(`https://www.reddit.com/r/FreeGamesOnSteam/new.json?limit=5&sort=new`)
        const posts = res.data.data.children
        if (posts.length == 0) {
            return client.channels.get(textChannel).send(`Nothing new in **r/FreeGamesOnSteam** :confused: `)
        } else {
            for (const post of posts) {
                const embed = redditPostToEmbed(post)
                client.channels.get(textChannel).send({ embed })
            }
        }
    } catch (err) {
        return err
    }
}

client.login(config.DiscordBotToken)
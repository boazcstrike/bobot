const Discord = require('discord.js')
const axios = require("axios")
var CronJob = require('cron').CronJob

const config = require('./config/config.json')
const redditPostToEmbed = require("./utils/redditPostToEmbed")

const client = new Discord.Client()

// variables
const testTextChannel = config.TestTextChannel
const gameDealsChannel = config.GameDealsTextChannel
const gamerChannel = config.GamerTextChannel
const memesChannel = config.MemesTextChannel

const defaultLimit = 5 // default number of post to send
const mainGamerChannel = gamerChannel // default gamer channel
const mainGameDealsChannel = gameDealsChannel // default gamer deals channel

client.on('ready', () => {
    console.log(`bobot news cron has started...`)
    // getAllNews(defaultLimit)
    getTopHourly('memes', memesChannel)

    // cron jobs
    const gamedealsJob = new CronJob('0 0 */18 * *', function () {
        console.log(`running every 18 hours...`)
        newNews()
    })
    const gamernewsJob = new CronJob('0 0 */8 * *', function () {
        console.log(`running every 8 hours...`)
        topNews()
    })
    const hourlyJob = new CronJob('0 0 */1 * *', function () {
        console.log(`running every hour...`)
        getTopHourly('memes', memesChannel)
    })
    
    //start the crons
    gamedealsJob.start()
    gamernewsJob.start()
    hourlyJob.start()

});

async function getAllNews() {
    newNews()
    topNews()
    getTopHourly('memes', memesChannel)
}

async function newNews(){
    getRedditNews('GameDeals', 'new', mainGameDealsChannel, defaultLimit)
    getRedditNews('FreeGamesOnSteam', 'new', mainGameDealsChannel, defaultLimit)
}

async function topNews(){
    getRedditNews('gaming', 'top', mainGamerChannel, defaultLimit)
    getRedditNews('GirlGamers', 'top', mainGamerChannel, defaultLimit)
}

async function getRedditNews(subreddit, filter, textChannel, limit) {
    try {
        let res = await axios.get(`https://www.reddit.com/r/` + subreddit + `/` + filter + `.json?limit=` + limit)
        const posts = res.data.data.children
        if (posts.length == 0) {
            return client.channels.get(textChannel).send(`Nothing new in **r/` + subreddit + `** :confused: `)
        } else {
            for (const post of posts) {
                const embed = redditPostToEmbed(post)
                !embed || embed == `` ?
                    console.log(`embed bad`) :
                    client.channels.get(textChannel).send({ embed })
            }
        }
    } catch (err) {
        return err
    }
}

async function getTopHourly(subreddit, textChannel) {
    try {
        let url = `https://www.reddit.com/r/` + subreddit + `/top.json?limit=10?t=hour`
        let res = await axios.get(url)
        const posts = res.data.data.children
        if (posts.length == 0) {
            return client.channels.get(textChannel).send(`Nothing new in **r/` + subreddit + `** :confused: `)
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
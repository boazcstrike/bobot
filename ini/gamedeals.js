const axios = require("axios")

var cron = require('node-cron')
var CronJob = require('cron').CronJob

const config = require('../config/config.json')
const redditPostToEmbed = require("./utils/redditPostToEmbed")

async function getGameDeals() {
    try{
        new CronJob('* * * * * *', function () {
            let res
            ref = await axios.get(
                `https://www.reddit.com/r/GameDeals/new.json?limit=1&sort=new`
            )
            const posts = res.data.data.children
            if (posts.length == 0) {
                client.channels.get(config.DiscordBotInitialTextChannel).send(`Nothing new in **${args[0]}** :confused: `)
            }
            const embed = redditPostToEmbed(post)
            client.channels.get(config.DiscordBotInitialTextChannel).send({ embed })
        }, null, true, 'America/Los_Angeles');
    }catch(err){
        console.log(err)
    }
}

module.exports = getGameDeals
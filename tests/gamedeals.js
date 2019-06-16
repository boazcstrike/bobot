const axios = require("axios")

const config = require('../config/config.json')
const redditPostToEmbed = require("../utils/redditPostToEmbed")

async function getGameDeals() {
    console.log(`sending r/GameDeals...`)
    try {
        let res = await axios.get(`https://www.reddit.com/r/GameDeals/new.json?limit=5&sort=new`)
        const posts = res.data.data.children
        if (posts.length == 0) {
            return client.channels.get(config.DiscordBotInitialTextChannel).send(`Nothing new in **GameDeals** :confused: `)
        } else {
            for (const post of posts) {
                const embed = redditPostToEmbed(post)
                client.channels.get(config.DiscordBotInitialTextChannel).send({ embed })
            }
        }
    } catch (err) {
        return err
    }
}


module.exports = getGameDeals
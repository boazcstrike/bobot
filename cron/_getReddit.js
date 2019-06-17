const axios = require("axios")

const redditPostToEmbed = require("../utils/redditPostToEmbed")

async function getPosts(client, subreddit, filter, textChannel, limit) {
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

async function getTopHourly(client, subreddit, textChannel) {
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

module.exports = {
    getPosts: getPosts,
    getTopHourly : getTopHourly,
}
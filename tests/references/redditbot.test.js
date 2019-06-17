// redditbot commands imports
const cmds = require('./commands/index')

try {
    cmds.check(message)
} catch (err) {
    console.log(err)
}

botMessage = `Trying to send ` + limit + ` subreddits of r/` + subreddit + ` with ` + filter + ` filter. 😎😎😎`
client.channels.get(textChannel).send({ botMessage })
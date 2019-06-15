// redditbot commands imports
const cmds = require('./commands/index')

try {
    cmds.check(message)
} catch (err) {
    console.log(err)
}
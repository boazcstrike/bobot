const config = require('../config/config.json')

// redditbot
const newPost = require('./new')
const help = require('./help')
const user = require('./user')
const top = require('./top')
const hot = require('./hot')

// for the codes
const github = require('./github')
const donate = require('./donate')
const random = require('./random')
const report = require('./issue')
const update = require('./update')
const invite = require('./invite')
const discord = require('./discord')
const clear_messages = require('./clear_messages')

const commands = {
    'new' : newPost,
    'help' : help,
    'user' : user,
    'top' : top,
    'hot' : hot,
    'github' : github,
    'donate' : donate,
    'random' : random,
    'report' : report,
    'update' : update,
    'invite' : invite,
    'discord' : discord,
    'clear' : clear_messages,
}

module.exports.check = function(message) {
    let args = message.content.slice(config.prefix.length).split(" ")
    const pref = message.content.toLowerCase().startsWith(config.prefix)

    if (pref) {
        if(commands[args[0]] != undefined) {
            return commands[args[0]](message)
        }else {
            return message.reply('This command doesn\'t exist yet, did you type the correct command?')
        }
    }

    if (message.content.startsWith('<@485047416291065859>')) {
        help(message)
    }

}

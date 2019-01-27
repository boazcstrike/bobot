var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var firebase = require("firebase");

var config = {
    apiKey: "AIzaSyBssN0vcQ8Sgvi7-2Euv3M4uz3YD6O6OBQ",
    authDomain: "bobot-f5859.firebaseapp.com",
    databaseURL: "https://bobot-f5859.firebaseio.com",
    projectId: "bobot-f5859",
    storageBucket: "bobot-f5859.appspot.com",
    messagingSenderId: "968295747019"
};

firebase.initializeApp(config);

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});

logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');

    logger.info(evt);
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '-=') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'test':
                bot.sendMessage({
                    to: channelID,
                    message: '```Test```'
                });
            break;
            // Just add any case commands if you want to..
         }
     }
});
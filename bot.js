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
var db = firebase.firestore();

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

    const docData = {
        botId: bot.id,
        botUsername: bot.username,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        detailedInfo: evt
    };
    const date = Date();

    db.collection("bobotNodes").doc(date).set(docData).then(function () {
        console.log("Bobot Initiated.");
    });
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '.') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        var timestamp = firebase.firestore.FieldValue.serverTimestamp();
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'test':                
                try{
                    const date = Date();
                    const docData = {
                        user: user,
                        messageInfo: evt,
                    };
                    db.collection("codes/test/"+userID).doc(date).set(docData).then(function () {
                        var log = "Document successfully written: " + message;
                        console.log(log);
                        bot.sendMessage({
                            to: channelID,
                            message: "Recorded in firebase."
                        });
                    });
                }catch(err){
                    bot.sendMessage({
                        to: channelID,
                        message: err,
                    });
                }
            break;
            // Just add any case commands if you want to..
         }
     }
});
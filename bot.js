var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var firebase = require("firebase");
var config = require('./firebaseConfig.json');

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
    const docData = {
        botId: bot.id,
        botUsername: bot.username,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        detailedInfo: evt
    };
    const date = Date();

    db.collection("bobotNodes").doc(date).set(docData).then(function () {
        console.log("Bobot login as:", bot.username, bot.id);
    });
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 5) == 'bobo ') {
        var args = message.substring(5).split(' ');
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
            case 'join':
                try{
                    client.joinVoiceChannel(channelID, callback);
                    bot.sendMessage({
                        to: channelID,
                        message: "Pak you Austria."
                    });
                }catch{
                }
            break;
            default:
                bot.sendMessage({
                    to: channelID,
                    message: "Impak kita diyan e!?"
                });
         }
     }
});
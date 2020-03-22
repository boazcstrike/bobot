const Discord = require('discord.js')
const config = require('./config/config.json')
const firebaseConfig = require('./config/firebaseConfig.json')
var firebase = require('firebase')

// firebase
firebase.initializeApp(firebaseConfig);

var db = firebase.database()

const luxon = require("luxon");
const DateTime = luxon.DateTime;
const local = DateTime.local();
const manilaTime = local.setZone("Asia/Manila");

// express
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var app = express()
const port = 3000


// start
db.ref("node_runs/").push({
    timestamp: manilaTime.toString(),
    action: "node app.js"
}, function(err){
    if(err){
        console.log(err)
    }else{
        console.log("The action is pushed to firebase.")
    }
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));

// DISCORD BOT
const client = new Discord.Client();
const cmds = require("./commands/index");
const badWords = require("./data/profanity")

//ready console
client.on("ready", () => {
  console.log(`Bobot commands ready.`);
  console.log(
    `Bobot initiated with ${client.users.size} users in ${client.channels.size} channels.`
  );
  console.log(`Ready on ${client.readyAt}`);
});

//messages
client.on("message", message => {

    if(message.author.bot === true){
        return console.log(``)
    }

    // bad words
    let bad = badWords.some(word => message.content.includes(word))
    if(bad===true){
        console.log(`Bad word detected, attempting to discipline...`)
        return message.channel.send("Don't use bad words :cry:")
    }

    try {
        const local = manilaTime.setLocale("ph");
        console.log(
            `${message.author.username} messaged '${message.content}' from ${message.channel.name}`
        );
        if (message.content === "check") {
          console.log('Grabbing attendance.')
        
          db.ref("anteriore/")
            .orderByChild("attendance")
            .limitToLast(7)
            .once('value')
            .then(function(snapshot){
              var dates = []
              var emp = []
              snapshot.forEach(function(childSnapshot){
                //attendance
                childSnapshot.forEach(function(child){
                  //dates
                  dates.push(child.key)
                  child.forEach(function(bata){
                    //employees
                    emp.push(bata.key)
                  })
                  message.channel.send(`>>> 7-Day Attendance
                  ${child.key}: ${emp}
                  `)
                })
              })
              console.log('Attendance sent.')
            }).catch(function(err){
              console.log(err)
            })

        } else if (message.content === ""){
          return console.log(`no message by ${message.author.username}`)
        } else if (message.content === "here"){
            console.log(`Starting firebase push...`)
            data = {
                date: local.toLocaleString(DateTime.DATE_SHORT),
                time: local.toLocaleString(DateTime.TIME_SIMPLE),
                text: true,
                voice: false,
            }
            
            db
            .ref("anteriore/attendance/" + local.toLocaleString(DateTime.DATE_MED)+'/').update({
              [message.author.username]: {
                time: data.time,
                text: data.text,
                voice: data.voice
              }
            }, function(err){
                if(err){
                    console.log(err)
                }else{
                    console.log(`Attendance recorded in firebase.`)
                }
            }).catch(function(err){
                console.log(err)
            })

            db.ref("anteriore/attendance/" + local.toLocaleString(DateTime.DATE_MED)+'/')
              .once("value")
              .then(function(snapshot) {
                if(!snapshot.val()) return console.log(`No data.`)
                var keys = Object.keys(snapshot.val())

                message
                  .channel.send(`>>> 'here' for today: ${keys.length}
                  ${message.author.username} :white_check_mark: ${local.toLocaleString(DateTime.DATETIME_HUGE)}.
                `);
              })
              .catch(function(err){
                  console.log(err)
              });

            console.log(`Attendance processed.`)
        } else {
            console.log(`Check...`);
            cmds.check(message);
            console.log(`\nOK.\n`);
        }

    } catch (err) {
        console.log(err);
    }
});

//connect to discord
client.login(config.DiscordBotToken);

//API

app.get("/", (req, res) => {
  res.json({
    client: botSesh
  });
});

// error handlers

//404
app.use(function(req, res, next) {
  res.status(404).send("Sorry can't find that!");
});

//500
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(port, () => {
  console.log(`Bobot webhook server is listening, port 3000`);
});

module.exports = app;
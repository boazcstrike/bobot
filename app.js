const Discord = require('discord.js')
const { MessengerClient } = require('messaging-api-messenger')
const { parse, stringify } = require('flatted/cjs');
// express
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express()

const config = require('./config/config.json')
const messengerConf = require('./config/messenger.json')

const fbmessClient = MessengerClient.connect(messengerConf.MessengerAccessToken)
const discordClient = new Discord.Client()

const port = 3000

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send('eh')
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404))
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.render('error')
});

app.listen(port, () => {
    console.log(`Bobot webhook server is listening, port 3000`)
});

module.exports = app
discordClient.login(config.DiscordBotToken)
// const Discord = require('discord.js')

// const config = require('./config/config.json')
// const cmds = require('./commands/index')

// const client = new Discord.Client()

// client.on('ready', () => {
//   console.log(`Bobot commands ready.`)
//   console.log(`Bobot initiated with ${client.users.size} users in ${client.channels.size} channels.`)
// });

// client.on('message', (message) => {
//   try{
//     cmds.check(message)
//   }catch(err){
//     console.log(err)
//   }
// })

// client.login(config.DiscordBotToken)

var luxon = require('luxon')
var DateTime = luxon.DateTime
var local = DateTime.local()
var rezoned = local.setZone("Asia/Manila");

console.log(rezoned.toString())

var d = new Date();
console.log(d);

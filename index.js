const Discord = require('discord.js')
const url = require('url')
const http = require('http')

const config = require('./config/config.json')

const client = new Discord.Client()

client.on('ready', () => {
  console.log(`Bobot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`)
  const clientData = JSON.stringify(client)
  const app = http.createServer((request, response) => {
    response.writeHead(200, { "Content-Type": "text/html" })
    response.write(JSON.stringify(clientData))
    response.end()
  });
  app.listen(8000)
  console.log(`Bobot served on http://localhost:8000`)

  console.log(clientData)
});

client.on('message', (user, userID, channelID, message, evt) => {
    console.log(user, userID, channelID, message, evt)
})

client.login(config.DiscordBotToken)
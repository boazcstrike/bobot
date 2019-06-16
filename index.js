const Discord = require('discord.js')
const axios = require('axios')
var cron = require('node-cron')
var CronJob = require('cron').CronJob

const redditPostToEmbed = require("./utils/redditPostToEmbed")
const config = require('./config/config.json')
const cmds = require('./commands/index')

const client = new Discord.Client()

async function getGameDeals(){
  console.log(`sending r/GameDeals...`)
  try{
    let res = await axios.get(`https://www.reddit.com/r/GameDeals/new.json?limit=5&sort=new`)
    const posts = res.data.data.children
    if(posts.length == 0){
      return client.channels.get(config.DiscordBotInitialTextChannel).send(`Nothing new in **GameDeals** :confused: `)
    }else{
      for(const post of posts){
        const embed = redditPostToEmbed(post)
        client.channels.get(config.DiscordBotInitialTextChannel).send({ embed })
      }
    }
  }catch(err){
    return err
  }
}

client.on('ready', () => {
  console.log(`Bobot has started, with ${client.users.size} users, in ${client.channels.size} channels.`)
  // of ${client.guilds.size} guilds.`)
  client.channels.get(config.DiscordBotInitialTextChannel).send(`hi, i'm alive!`)
  getGameDeals()

  const task = cron.schedule('1 * * * *', () => {
    getGameDeals()
  });
  task.start()
});

client.on('message', (message) => {
  console.log("MESSAGE: "+message)
  try{
    cmds.check(message)
  }catch(err){
    console.log(err)
  }
})

client.login(config.DiscordBotToken)
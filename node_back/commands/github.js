const TurndownService = require('turndown')
const turndownService = new TurndownService()


async function git (message) {
    try {
      const embed = {
        title: 'Github Repository',
        author: {
          name: 'Github.com',
          url: 'https://www.github.com',
          icon_url: 'https://github.com/fluidicon.png',
        },
        description: turndownService.turndown('<a href="https://github.com/boazcstrike/Bobot">Bobot repository link</a>'),
        color: 2369838,
        footer: {
          icon_url: 'https://hackbrightacademy.com/content/uploads/2018/08/Reddit-logo.png',
          text: 'Bobot by boazcstrike',
        },
      }
      await message.channel.send({ embed })
    } catch (err) {
      console.log(err)
  }
}

module.exports = git
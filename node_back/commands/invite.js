const TurndownService = require('turndown')
const turndownService = new TurndownService()

async function invite(message) {
    try {
            const embed = {
                    title: 'This is the link to invite bobot to a server!',
                    description: turndownService.turndown(`<a href="https://discordapp.com/oauth2/authorize?client_id=539085820120793097&scope=bot&permissions=0">Click here to invite me!</a>`),
                    color: 16729344,
                    footer: {
                    icon_url: 'https://hackbrightacademy.com/content/uploads/2018/08/Reddit-logo.png',
                    text: 'Bobot by boazcstrike',
                }
            }

        await message.channel.send( { embed } )

    } catch(error) {
        console.log(error)
    }
}

module.exports = invite
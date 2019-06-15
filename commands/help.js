async function help(message) {
    const embed = {
        title: `Check my crazy commands below!`,
        author: {
            name: 'Bobot',
            url: 'https://github.com/boazcstrike/Bobot',
            icon_url: "https://i.kym-cdn.com/photos/images/newsfeed/000/919/691/9e0.png"
        },
        description: `**Prefix: bobo**\n
**Commands:**
- help
- report (If you find a bug just help us by reporting it)
- update (To let you know what is going on with Bobot)
- github (If you want to check the source code, you can take a look :eyes:)
- donate (If you want you can support us to help us handle hosting costs)
- invite (If you want to invite me on your server just use this command)
- discord (Bobot support server)
- patreon (Join our team by supporting us!)
----------------------------------------
**Reddit commands:**
- new [subreddit name] <Number of posts>
- hot [subreddit name] <Number of posts>
- top [subreddit name] <Number of posts>
- random <Number of posts>
- user [username] (looking for users)`,
        timestamp: new Date(),
        color: 16729344,
        footer: {
            text: 'Bobot by boazcstrike',
            icon_url: "https://hackbrightacademy.com/content/uploads/2018/08/Reddit-logo.png"
        },
    }
  await message.channel.send({ embed })
}

module.exports = help
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
- report (find a bug? pls help me by reporting it in github **[create issue]** :fire:)
- update (what's going on with the forked RedditBot)
- github (check the source code, take a look :eyes:)
- donate (support hosting costs 😍)
- invite (invite bobot to a server)
- discord (Bobot support server NOT AVAILABLE YET!)
----------------------------------------
**Reddit commands:**
- new [subreddit name] <Number of posts>
- hot [subreddit name] <Number of posts>
- top [subreddit name] <Number of posts>
- random <Number of posts>
- user [username] (looking for users)
----------------------------------------
**Forked from Reddit Bot by SerekKiri & MiXerek**`,
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
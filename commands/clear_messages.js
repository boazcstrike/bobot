// ref: https://github.com/praneetsharma/ClearMessagesBot-Discord/blob/master/clear-messages.js

async function clear_messages(message) {
    let mes = message.content.slice(11)
    let args = mes.split(" ")

    // Check the following permissions before deleting messages:
    //    1. Check if the user has enough permissions
    //    2. Check if I have the permission to execute the command

    if (!message.channel.permissionsFor(message.author).has("MANAGE_MESSAGES")) {
        message.channel.send("Sorry, you don't have the permission to execute the command \"" + message.content + "\"");
        console.log("Sorry, you don't have the permission to execute the command \"" + message.content + "\"");
        return;
    } // code below is deprecated
    // } else if (!message.channel.permissionsFor(bot.user).hasPermission("MANAGE_MESSAGES")) {
    //     message.channel.sendMessage("Sorry, I don't have the permission to execute the command \"" + message.content + "\"");
    //     console.log("Sorry, I don't have the permission to execute the command \"" + message.content + "\"");
    //     return;
    // }

    // Only delete messages if the channel type is TextChannel
    // DO NOT delete messages in DM Channel or Group DM Channel
    if (message.channel.type == 'text') {
        message.channel.fetchMessages()
            .then(messages => {
                try {
                    message.channel.bulkDelete(args[0])
                    const embed = {
                        author: {
                            name: 'Bobot',
                            url: 'https://github.com/boazcstrike/Bobot',
                            icon_url: 'https://meme.xyz/uploads/posts/t/l-27018-thumbs-up-rambo.jpg'
                        },
                        description: `
                        Deletion of messages successful. If you're wondering why the message is still there, it's because I cannot delete messages that are 14 days and older. :cry:
                        Total messages to be deleted: ${args[0]}`,
                        color: 16729344
                    }

                    message.channel.send({ embed })
                    console.log('Deletion of messages successful. Total messages deleted: ' + messages.size)
                } catch (err) {
                    console.log('Error while doing Bulk Delete');
                    console.log(err);
                }
            })
    }
}

module.exports = clear_messages
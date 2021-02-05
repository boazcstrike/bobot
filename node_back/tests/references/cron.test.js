/* NODE-CRON

Allowed values
field	value
second	0-59
minute	0-59
hour	0-23
day of month	1-31
month	1-12 (or names)
day of week	0-7 (or names, 0 or 7 are sunday)

# ┌────────────── second(optional)
# │ ┌──────────── minute
# │ │ ┌────────── hour
# │ │ │ ┌──────── day of month
# │ │ │ │ ┌────── month
# │ │ │ │ │ ┌──── day of week
# │ │ │ │ │ │
# │ │ │ │ │ │
# * * * * * */
var cron = require('node-cron');
cron.schedule('* * * * *', () => {
    console.log('running a task every minute');
});
cron.schedule('1,2,4,5 * * * *', () => {
    console.log('running every minute 1, 2, 4 and 5');
});
cron.schedule('1-5 * * * *', () => {
    console.log('running every minute to 1 from 5');
});
cron.schedule('*/2 * * * *', () => {
    console.log('running a task every two minutes');
});
cron.schedule('* * * January,September Sunday', () => {
    console.log('running on Sundays of January and September');
});
cron.schedule('* * * Jan,Sep Sun', () => {
    console.log('running on Sundays of January and September');
});

/* CRON

Seconds: 0 - 59
Minutes: 0 - 59
Hours: 0 - 23
Day of Month: 1 - 31
Months: 0 - 11(Jan - Dec)
Day of Week: 0 - 6(Sun - Sat)

*/

var CronJob = require('cron').CronJob;
new CronJob('* * * * * *', function () {
    client.channels.get(config.DiscordBotInitialTextChannel).send(`This is from cron, should run every sec`)
}, null, true, 'America/Los_Angeles');

// every 10 minutes
console.log('Before job instantiation');
const job = new CronJob('0 */10 * * * *', function () {
    const d = new Date();
    console.log('Every Tenth Minute:', d);
});
console.log('After job instantiation');
job.start();

// basic
console.log('Before job instantiation');
const job = new CronJob('* * * * * *', function () {
    const d = new Date();
    console.log('Every second:', d);
});
console.log('After job instantiation');
job.start();

// every_30_minutes_between_9_and_5.js
console.log('Before job instantiation');
const job = new CronJob('0 */30 9-17 * * *', function () {
    const d = new Date();
    console.log('Every 30 minutes between 9-17:', d);
});
console.log('After job instantiation');
job.start();

// get next runs
const job = new CronJob(
    '0 * * * * *',
    function () {
        console.log('Date: ', new Date());
    },
    null,
    true
);

console.log('System TZ next 5: ', job.nextDates(5));

const jobUTC = new CronJob(
    '0 * * * * *',
    function () {
        console.log('Date: ', new Date());
    },
    null,
    true,
    'UTC'
);

console.log('UTC next 5: ', jobUTC.nextDates(5));
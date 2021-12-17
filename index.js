require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const Discord = require('discord.js');
const emojiRegex = require('emoji-regex');

const DateHelpers = require('./classes/helpers/DateHelpers');
const DiscordHelpers = require('./classes/helpers/DiscordHelpers');
const EmojiHelpers = require('./classes/helpers/EmojiHelpers');
const EmojiReportStocks = require('./classes/commands/EmojiReportStocks');
const EmojiReportKings = require('./classes/commands/EmojiReportKings');


const devMode = false;
const spirgelUserId = '273695758887157762';
const devUserId = spirgelUserId;
const devModeReply = "I am in testing mode, I will only respond to the bot admin right now, sorry this is only temporary for testing.";
const defaultErrorMessage = "uh-oh, something went wrong, contact Spirgel, I'm just a bot. ¯\\_(ツ)_/¯";

const discordClient = new Discord.Client();

discordClient.on("ready", async () => {
	console.log('==========');
	console.log('==========');
	console.log('==========');
	console.log('==========');
	console.log('==========');
	console.log('==========');
	console.log('==========');
	console.log('==========');
	console.log('==========');
	console.log('==========');
	console.log(`Logged in as ${discordClient.user.tag}!`);
	
	const hiveGuildId = '231204322145337344';
	const hiveGuild = discordClient.guilds.cache.get(hiveGuildId);
	// const hiveSportsChannelId = '711241518714847274';
	// const hiveSportsChannel = hiveGuild.channels.cache.get(hiveSportsChannelId);
	// console.log(hiveSportsChannel.lastMessageID);
	// const mostRecenthiveSportsChannelMessage = await hiveSportsChannel.messages.fetch(hiveSportsChannel.lastMessageID);
	// console.log(mostRecenthiveSportsChannelMessage);
	
	// const spirgelsGuildId = '717413056086278196';
	// const spirgelsGuild = discordClient.guilds.cache.get(spirgelsGuildId);
	// const testChannelId = '717428158609096764';
	// const testChannel = spirgelsGuild.channels.cache.get(testChannelId);
	// const testMessageId = '749741331370213376';
	// const testMessage = await testChannel.messages.fetch(testMessageId);

	// const dateNow = Date.now();
	// const date30DaysPast = DateHelpers.addDaysToDate(dateNow, -3);
	// const dateMinimum = date30DaysPast;
	// const dateMaximum = dateNow;
	// const emojiReportKings = new EmojiReportKings({
	// 	client: discordClient,
	// 	guild: hiveGuild,
	// 	dateMinimum: dateMinimum,
	// 	dateMaximum: dateMaximum,
	// 	minimumUseThreshold: 0,
	// 	debug: true
	// });
	// const kingsOutput = await emojiReportKings.generateOutput();

});

discordClient.on("message", async (message) => {
	if (!message.author.bot) {

		let messageWords = message.content.split(' ');
		messageWords = messageWords.filter((word) => {
			if (word !== '') {
				return true;
			}
		});

		if (message.content === "!emoji-report" || message.content.startsWith("!emoji-report ")) {
			if (devMode && message.author.id !== devUserId) {
				message.channel.send(devModeReply);
				return;
			}
			else if (message.content.startsWith("!emoji-report help")) {
				message.reply([
					"I'm a bot that can show you various statistics about emoji usage on this server.",
					"Here are some commands you can choose from:",
					"",
					":chart_with_upwards_trend: `!emoji-report stocks`",
					"> Displays a comparison of recent emoji usage to their usage in the past.",
					"> aliases include: `!emoji-report stonks`",
					"",
					":crown: `!emoji-report [emoji] kings`",
					"> Displays who uses emoji the most. Choosing a specific emoji is optional.",
					"> aliases include: `!emoji-report [emoji] short kings`, `!emoji-report [emoji] queens`, `!emoji-report [emoji] qweens`",
					// "",
					// ":mag_right: `!emoji-report [user]`",
					// "> Displays a specific users most used emoji.",
				]);
			}
			else if (message.content === "!emoji-report stocks" ||
			message.content === "!emoji-report stonks") {
				try {
					message.channel.send("Generating stocks report. This may take a while, I'll tag you when it's ready.");
					const reportRequestedTimestamp = Date.now();
					let date1Minimum, date1Maximum, date2Minimum, date2Maximum, timeScale;
					const dateNow = reportRequestedTimestamp;

					if (message.content.includes("from the past year")) {
						timeScale = 'year';
						const date365DaysPast = DateHelpers.addDaysToDate(dateNow, -365);
						const date730DaysPast = DateHelpers.addDaysToDate(dateNow, -730);
						date1Minimum = date365DaysPast;
						date1Maximum = dateNow;
						date2Minimum = date730DaysPast;
						date2Maximum = DateHelpers.addMillisecondsToDate(date365DaysPast, -1);
					}
					else if (message.content.includes("from the past month")) {
						timeScale = 'month';
						const date30DaysPast = DateHelpers.addDaysToDate(dateNow, -30);
						const date60DaysPast = DateHelpers.addDaysToDate(dateNow, -60);
						date1Minimum = date30DaysPast;
						date1Maximum = dateNow;
						date2Minimum = date60DaysPast;
						date2Maximum = DateHelpers.addMillisecondsToDate(date30DaysPast, -1);
					}
					else {
						timeScale = 'week';
						const date7DaysPast = DateHelpers.addDaysToDate(dateNow, -7);
						const date14DaysPast = DateHelpers.addDaysToDate(dateNow, -14);
						date1Minimum = date7DaysPast;
						date1Maximum = dateNow;
						date2Minimum = date14DaysPast;
						date2Maximum = DateHelpers.addMillisecondsToDate(date7DaysPast, -1);
					}

					const emojiReportStocks = new EmojiReportStocks({
						client: discordClient,
						locations: message.channel.guild,
						date1Minimum: date1Minimum,
						date1Maximum: date1Maximum,
						date2Minimum: date2Minimum,
						date2Maximum: date2Maximum,
						debug: true
					});

					const stocksOutput = await emojiReportStocks.generateOutput();
					message.reply(`here is your emoji stocks report comparing the past ${timeScale} of emoji usage to their usage from the ${timeScale} prior.`);
					for (let stocksMessage of stocksOutput) {
						message.channel.send(stocksMessage);
					}
					const reportDeliveredTimestamp = Date.now();
					const reportDurationMilliseconds = reportDeliveredTimestamp - reportRequestedTimestamp;
					const reportDurationString = DateHelpers.millisecondsToString(reportDurationMilliseconds);
					message.channel.send("Report created in " + reportDurationString + ".");
				}
				catch (error) {
					message.reply(defaultErrorMessage);
					console.error(error);
				}
			}
			else if (message.content === "!emoji-report kings" ||
			message.content === "!emoji-report short kings" ||
			message.content === "!emoji-report queens" ||
			message.content === "!emoji-report qweens") {
				try {
					const reportRequestedTimestamp = Date.now();
					const dateNow = reportRequestedTimestamp;
					const date30DaysPast = DateHelpers.addDaysToDate(dateNow, -30);
					const dateMinimum = date30DaysPast;
					const dateMaximum = dateNow;
					const emojiReportKings = new EmojiReportKings({
						client: discordClient,
						guild: message.channel.guild,
						message: message,
						dateMinimum: dateMinimum,
						dateMaximum: dateMaximum,
						minimumUseThreshold: 3,
						invalidateTemporaryCachedData: false,
						debug: true
					});
					const kingsOutput = await emojiReportKings.generateOutput();
					message.reply(`here is your kings report displaying who used each emoji the most over the course of the past month.`);
					for (let kingsMessage of kingsOutput) {
						message.channel.send(kingsMessage);
					}
					if (emojiReportKings.usingCachedResults) {
						message.channel.send(`I was able to speed up the process by relying on recently cached data.`);
					}
					else {
						const reportDeliveredTimestamp = Date.now();
						const reportDurationMilliseconds = reportDeliveredTimestamp - reportRequestedTimestamp;
						const reportDurationString = DateHelpers.millisecondsToString(reportDurationMilliseconds);
						message.channel.send("Report created in " + reportDurationString + ".");
					}
				}
				catch (error) {
					message.reply(defaultErrorMessage);
					console.error(error);
				}
			}
			else if ((EmojiHelpers.getEmojiStringsFromString(messageWords[1]).length === 1) && (
				messageWords[2] === 'kings' ||
				(messageWords[2] === 'short' && messageWords[3] === 'kings') ||
				messageWords[2] === 'queens' ||
				messageWords[2] === 'qweens')
			) {
				try {
					const reportRequestedTimestamp = Date.now();
					const dateNow = reportRequestedTimestamp;
					const date30DaysPast = DateHelpers.addDaysToDate(dateNow, -30);
					const dateMinimum = date30DaysPast;
					const dateMaximum = dateNow;
					const specificEmoji = EmojiHelpers.getEmojiStringsFromString(messageWords[1])[0];
					const emojiReportKings = new EmojiReportKings({
						client: discordClient,
						guild: message.channel.guild,
						message: message,
						dateMinimum: dateMinimum,
						dateMaximum: dateMaximum,
						specificEmoji: specificEmoji,
						minimumUseThreshold: 0,
						invalidateTemporaryCachedData: false,
						debug: true
					});
					const kingsOutput = await emojiReportKings.generateOutput();
					message.reply(`here is your kings report displaying who used ${specificEmoji.string} the most over the past month.`);
					for (let kingsMessage of kingsOutput) {
						message.channel.send(kingsMessage);
					}
					if (emojiReportKings.usingCachedResults) {
						message.channel.send(`I was able to speed up the process by relying on recently cached data.`);
					}
					else {
						const reportDeliveredTimestamp = Date.now();
						const reportDurationMilliseconds = reportDeliveredTimestamp - reportRequestedTimestamp;
						const reportDurationString = DateHelpers.millisecondsToString(reportDurationMilliseconds);
						message.channel.send("Report created in " + reportDurationString + ".");
					}
				}
				catch (error) {
					message.reply(defaultErrorMessage);
					console.error(error);
				}
			}
			else {
				message.reply([
					"I don't recognize that command.",
					"You should try `!emoji-report help` to get a list of available commands <:SpongebobMock:453031885506084864>"
				]);
			}
		}
	}
});

discordClient.login(process.env.BOT_TOKEN);
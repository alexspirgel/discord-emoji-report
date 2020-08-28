require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const Discord = require('discord.js');
const emojiRegex = require('emoji-regex');

const DateHelpers = require('./classes/helpers/DateHelpers');
const DiscordHelpers = require('./classes/helpers/DiscordHelpers');
const EmojiHelpers = require('./classes/helpers/EmojiHelpers');
const EmojiReportStocks = require('./classes/commands/EmojiReportStocks');

const defaultErrorMessage = "Uh-oh, something went wrong, contact Spirgel, I'm just a bot. ¯\\_(ツ)_/¯";

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
	const generalChannelId = '231204322145337344';
	const generalChannel = hiveGuild.channels.cache.get(generalChannelId);
	const botChannelId = '718193008939368499';
	const botChannel = hiveGuild.channels.cache.get(botChannelId);
	const voiceChannelId = '231204322145337345';
	const voiceChannel = hiveGuild.channels.cache.get(voiceChannelId);
	
	const spirgelsGuildId = '717413056086278196';
	const spirgelsGuild = discordClient.guilds.cache.get(spirgelsGuildId);
	const testChannelId = '717428158609096764';
	const testChannel = spirgelsGuild.channels.cache.get(testChannelId);
	const testMessageId = '721877273724321849';
	const testMessage = await testChannel.messages.fetch(testMessageId);

	DiscordHelpers.getGuildEmojis(hiveGuild);
});

discordClient.on("message", async (message) => {
	// FOR TESTING SO IT ONLY RESPONDS TO ME
	const spirgelUserId = '273695758887157762';
	if (!message.author.bot) {
		if (message.content.includes("!emoji-report help")) {
			message.reply([
				"I'm a bot that can show you various statistics about emoji usage on this server.",
				"Here are some commands you can choose from:",
				"",
				"`!emoji-report stocks`",
				"> Displays a comparison of recent emoji usage to their usage in the past.",
				"",
				// "`!emoji-report kings`",
				// "> Displays who uses each emoji the most.",
				// "",
				"... more coming soon."
			]);
		}
		else if (message.content.startsWith("!emoji-report stocks") || message.content.startsWith("!emoji-report stoncks")) {
			message.channel.send("Generating report. This may take a while, I'll tag you when it's ready.");
			const reportRequestedTimestamp = Date.now();
			try {
				const dateNow = Date.now();
				const date7DaysPast = DateHelpers.addDaysToDate(dateNow, -7);
				const date14DaysPast = DateHelpers.addDaysToDate(dateNow, -14);

				const emojiReportStocks = new EmojiReportStocks({
					client: discordClient,
					locations: message.channel.guild,
					date1Minimum: date7DaysPast,
					date1Maximum: dateNow,
					date2Minimum: date14DaysPast,
					date2Maximum: DateHelpers.addMillisecondsToDate(date7DaysPast, -1),
					debug: true
				});

				const stocksOutput = await emojiReportStocks.generateOutput();
				message.reply("Here is your emoji stocks report comparing the past week of emoji usage to their usage from the week prior.");
				for (let stocksMessage of stocksOutput) {
					message.channel.send(stocksMessage);
				}
				const reportDeliveredTimestamp = Date.now();
				const reportDurationMilliseconds = reportDeliveredTimestamp - reportRequestedTimestamp;
				const reportDurationString = DateHelpers.millisecondsToString(reportDurationMilliseconds);
				message.channel.send("Report finished in " + reportDurationString + ".");
			}
			catch (error) {
				message.reply(defaultErrorMessage);
				console.error(error);
			}
		}
		else if (message.content === "!emoji-report kings" || message.content === "!emoji-report short-kings" || message.content === "!emoji-report queens" || message.content === "!emoji-report qweens") {
			if (message.author.id === spirgelUserId) {
				message.channel.send("Generating report. This may take a while, I'll tag you when it's ready.");
				try {
					// const emojiReportKings = new EmojiReportKings({
					// 	client: discordClient,
					// 	locations: message.channel.guild,
					// 	debug: true
					// });
				}
				catch (error) {
					message.reply(defaultErrorMessage);
					console.error(error);
				}
			}
		}
	}
});

discordClient.login(process.env.BOT_TOKEN);
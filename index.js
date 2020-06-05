require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const emojiRegex = require('emoji-regex');
const nodeEmoji = require('node-emoji');

const client = new Discord.Client();

const dataDir = './data';

const writeJsonFile = (location, data) => {
	data = JSON.stringify(data);
	let dirname = path.dirname(location);
	fs.mkdirSync(dirname, {recursive:true});
	fs.writeFileSync(location, data);
};

const getGuildEmojis = (guild) => {
	const emoji = [];
	guild.emojis.cache.each((guildEmoji) => {
		emoji.push({
			name: guildEmoji.name,
			id: guildEmoji.id,
			string: '<:' + guildEmoji.name + ':' + guildEmoji.id + '>'
		});
	});
	return emoji;
};

const getMostRecentTextChannelMessageFromDateRange = async (textChannel, dateMin, dateMax) => {
	const targetDateMin = new Date(dateMin);
	const targetDateMax = new Date(dateMax);
	const isDateWithinRange = (date) => {
		const compareDate = new Date(date);
		if (compareDate >= targetDateMin && compareDate <= targetDateMax) {
			return true;
		}
		return false;
	};

	let messageBatch;
	let messageMatch;
	let messageMatchOlder;

	const latestMessage = await textChannel.messages.fetch(textChannel.lastMessageID);
	let message = latestMessage;

	if (isDateWithinRange(message.createdTimestamp)) {
		messageMatch = latestMessage;
	}

	const messageBatchSize = 100;
	let batchCount = 0;
	messageBatch = await textChannel.messages.fetch({
		before: message.id,
		limit: messageBatchSize
	});

	while (!messageMatch) {
		batchCount++;
		// Sort by most recent first because the default order is unreliable.
		messageBatch.sort((messageA, messageB) => {
			return messageB.createdTimestamp - messageA.createdTimestamp
		});
		// Find the most recent message from the target date range.
		messageMatch = messageBatch.find((message) => {
			if (isDateWithinRange(message.createdTimestamp)) {
				return true;
			}
		});
		if (!messageMatch) {
			// Find any message created before the target date range.
			messageMatchOlder = messageBatch.find((message) => {
				if (new Date(message.createdTimestamp) < targetDateMin) {
					return true;
				}
			});
			if (messageMatchOlder) {
				messageMatch = null;
			}
			else {
				messageBatch = await textChannel.messages.fetch({
					before: messageBatch.last().id,
					limit: messageBatchSize
				});
			}
		}
	}

	return messageMatch;
};

const getTextChannelEmojisFromDateRange = async (textChannel, dateMin, dateMax) => {
	const targetDateMin = new Date(dateMin);
	const targetDateMax = new Date(dateMax);
	let emojis = [];
	const mostRecentMessageFromDateRange = await getMostRecentTextChannelMessageFromDateRange(textChannel, dateMin, dateMax);
	let message = mostRecentMessageFromDateRange;
	let count = 0;
	process.stdout.write("Gathering emojis...");
	while (message) {
		count++;
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write("Gathering emojis from " + count + " messages.");
		let messageEmojis = await getEmojisFromMessage(message);
		emojis = emojis.concat(messageEmojis);
		let previousMessage = await textChannel.messages.fetch({
			before: message.id,
			limit: 1
		});
		message = null;
		previousMessage = previousMessage.first();
		if (previousMessage) {
			previousMessageCreatedDate = new Date(previousMessage.createdTimestamp);
			if (previousMessageCreatedDate >= targetDateMin && previousMessageCreatedDate <= targetDateMax) {
				message = previousMessage;
			}
		}
	}
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	process.stdout.write("Gathered emojis from " + count + " messages.");
	process.stdout.write("\n");
	console.log(emojis);
	return emojis;
}

const getEmojisFromMessage = async (message) => {
	const emojis = [];

	const customEmojisInContent = getCustomEmojiStringsFromString(message.content);
	for (const customEmoji of customEmojisInContent) {
		emojis.push({
			name: customEmoji.name,
			string: customEmoji.string,
			type: 'custom',
			usage: 'content',
			messageId: message.id,
			userId: message.author.id,
			timestamp: message.createdTimestamp
		});
	}

	const unicodeEmojisInContent = getUnicodeEmojiStringsFromString(message.content);
	for (const unicodeEmoji of unicodeEmojisInContent) {
		emojis.push({
			name: unicodeEmoji.name,
			string: unicodeEmoji.string,
			type: 'unicode',
			usage: 'content',
			messageId: message.id,
			userId: message.author.id,
			timestamp: message.createdTimestamp
		});
	}

	for (const reaction of message.reactions.cache.array()) {
		const reactionUsers = await reaction.users.fetch();
		for (const user of reactionUsers.array()) {
			const emojiObject = {
				name: '',
				string: '',
				type: '',
				usage: 'reaction',
				messageId: message.id,
				userId: user.id,
				timestamp: message.createdTimestamp
			};
			if (reaction.emoji.id) {
				emojiObject.name = reaction.emoji.name;
				emojiObject.string = '<:' + reaction.emoji.name + ':' + reaction.emoji.id + '>';
				emojiObject.type = 'custom';
			}
			else {
				const unicodeEmoji = getUnicodeEmojiStringsFromString(reaction.emoji.name);
				emojiObject.name = unicodeEmoji[0].name;
				emojiObject.string = unicodeEmoji[0].string;
				emojiObject.type = 'unicode';
			}
			emojis.push(emojiObject);
		}
	}

	return emojis;
};

const getCustomEmojiNameFromCustomEmojiString = (customEmojiString) => {
	const regex = /(?<=<:)(.*)(?=:\d+>)/;
	return customEmojiString.match(regex)[0];
};

const getCustomEmojiIdFromCustomEmojiString = (customEmojiString) => {
	const regex = /(?<=:)(\d*)(?=>)/;
	return customEmojiString.match(regex)[0];
};

const getCustomEmojiStringsFromString = (string) => {
	const regex = /<:[^:\s]*(?:::[^:\s]*)*:\d+>/g;
	const regexMatches = string.match(regex);
	const matches = [];
	let match;
	if (regexMatches) {
		for (match of regexMatches) {
			matches.push({
				name: getCustomEmojiNameFromCustomEmojiString(match),
				string: match
			});
		}
	}
	return matches;
};

const getUnicodeEmojiStringsFromString = (string) => {
	const regex = emojiRegex();
	const matches = [];
	let match;
	while (match = regex.exec(string)) {
		const unicodeEmojiName = nodeEmoji.which(match[0]);
		if (unicodeEmojiName) {
			matches.push({
				name: unicodeEmojiName,
				string: match[0]
			});
		}
	}
	return matches;
};

client.on("ready", () => {
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
	console.log(`Logged in as ${client.user.tag}!`);
	const hiveGuildId = '231204322145337344';
	const hiveGuild = client.guilds.cache.get(hiveGuildId);
	const generalChannelId = '231204322145337344';
	const generalChannel = hiveGuild.channels.cache.get(generalChannelId);
	const botChannelId = '718193008939368499';
	const botChannel = hiveGuild.channels.cache.get(botChannelId);
	writeJsonFile('./test1/test2/test.json', {a:123});
	// getTextChannelEmojisFromDateRange(botChannel, '2020/6/4', Date.now());
});

client.on("message", async (message) => {
	// FOR TESTING SO IT ONLY RESPONDS TO ME
	const spirgelUserId = '273695758887157762';
	if (message.author.id === spirgelUserId) {
		if (message.content === "!emoji-report") {
			message.channel.send("Crawling messages. This may take a while, I'll tag you when I'm finished.");
			try {
				const emojiData = await getEmojiData(message.channel.guild);
				message.reply("Here are your results.");
			}
			catch (error) {
				message.reply("Uh-oh, something went wrong, contact Spirgel, I'm just a bot. ¯\\_(ツ)_/¯");
				console.error(error);
			}
		}
		else if (message.content === "!emoji-report audit") {}
		else if (message.content === "!emoji-report stocks" || message.content === "!emoji-report stoncks") {
			// show all custom emoji stocks
			// show movers and shakers of unicode emoji
		}
		else if (message.content === "!emoji-report help") {}
	}
});

client.login(process.env.BOT_TOKEN);
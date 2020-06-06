require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const Discord = require('discord.js');
const emojiRegex = require('emoji-regex');
const nodeEmoji = require('node-emoji');
const GuildDatabaseCollection = require('./classes/GuildDatabaseCollection');
const EmojiObject = require('./classes/EmojiObject');

const runMongoClientCommands = async (mongoClientCommands) => {
	const mongoConnectionUrl = 'mongodb://localhost:27017';
	const mongoConnectionOptions = {
		useUnifiedTopology: true
	};
	const logErrorCallback = (error) => {
		if (error) {
			console.error(error);
		}
	};
	const mongoClient = await new MongoClient(mongoConnectionUrl, mongoConnectionOptions, logErrorCallback).connect();
	console.log('Connected to ' + mongoConnectionUrl);
	const returnValue = await mongoClientCommands(mongoClient);
	mongoClient.close();
	console.log('Closed connection to ' + mongoConnectionUrl);
	return returnValue;
};

const runMongoDatabaseCommands = async (mongoDatabaseCommands) => {
	const databaseName = 'discordEmojiReport';
	const returnValue = await runMongoClientCommands(async (mongoClient) => {
		const database = mongoClient.db(databaseName);
		console.log('Using database: ' + databaseName);
		const returnValue = await mongoDatabaseCommands(database);
		return returnValue;
	});
	return returnValue;
};

const generateGuildDatabaseCollectionName = (guild) => {
	return 'guild-' + guild.id;
};

const addGuildDatabaseCollection = async (guild) => {
	const guildDatabaseCollection = new GuildDatabaseCollection(guild);
	await updateGuildDatabaseCollection(guild, guildDatabaseCollection.data);
};

const getGuildDatabaseCollection = async (guild) => {
	const guildDatabaseCollectionName = generateGuildDatabaseCollectionName(guild);
	const collectionValues = await runMongoDatabaseCommands(async (database) => {
		const collection = await database.collection(guildDatabaseCollectionName);
		const collectionValues = await collection.findOne({});
		return collectionValues;
	});
	return collectionValues;
};

const updateGuildDatabaseCollection = async (guild, data) => {
	const guildDatabaseCollectionName = generateGuildDatabaseCollectionName(guild);
	const collectionValues = await runMongoDatabaseCommands(async (database) => {
		const collection = await database.collection(guildDatabaseCollectionName);
		await collection.deleteMany({});
		await collection.insertOne(data);
	});
	return collectionValues;
};

const addDayToDate = (date) => {
	date = new Date(date);
	let nextDay = new Date(new Date(date).setDate(date.getDate() + 1));
	return nextDay;
};

const isDateWithinRange = (dateMin, dateMax, date) => {
	dateMin = new Date(dateMin);
	dateMax = new Date(dateMax);
	date = new Date(date);
	if (date >= dateMin && date <= dateMax) {
		return true;
	}
	else {
		return false;
	}
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

const getFullDaysWithinDateRange = (dateMin, dateMax) => {
	const addOneDayToDate = (date) => {
		return new Date(new Date(date).setDate(date.getDate() + 1));
	};
	const daysWithin = [];
	dateMin = new Date(dateMin);
	dateMax = new Date(dateMax);
	let dayStart = new Date(new Date(dateMin).setHours(0,0,0,0));
	let dayEnd = new Date(new Date(dayStart).setDate(dayStart.getDate() + 1));
	while (dayStart < dateMax) {
		if (dayStart >= dateMin && dayStart <= dateMax &&
		dayEnd >= dateMin && dayEnd <= dateMax) {
			daysWithin.push(dayStart);
		}
		dayStart = addOneDayToDate(dayStart);
		dayEnd = addOneDayToDate(dayEnd);
	}
	return daysWithin;
};

const getMostRecentTextChannelMessageFromDateRange = async (textChannel, dateMin, dateMax) => {
	const targetDateMin = new Date(dateMin);
	const targetDateMax = new Date(dateMax);

	let messageBatch;
	let messageMatch;
	let messageMatchOlder;
	let message;
	message = await textChannel.messages.fetch(textChannel.lastMessageID);

	// const dateRangeMaxNextDay = addDayToDate(dateMax);
	// // If the date range maximum is less than a day away.
	// if (dateRangeMaxNextDay > Date.now()) {
	// 	// Start looking at the most recent message in the channel.
	// 	message = await textChannel.messages.fetch(textChannel.lastMessageID);
	// }
	// // If the date range maximum is further than a day away.
	// else {
	// 	textChannel.messages.cache.filter((message) => {
	// 		return isDateWithinRange(dateMin, dateMax, message.createdTimestamp);
	// 	});
		
	// }

	if (message.createdTimestamp >= targetDateMin && message.createdTimestamp <= targetDateMax) {
		messageMatch = message;
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
			if (message.createdTimestamp >= targetDateMin && message.createdTimestamp <= targetDateMax) {
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
	const fullDaysToCache = getFullDaysWithinDateRange(dateMin, dateMax);
	const targetDateMin = new Date(dateMin);
	const targetDateMax = new Date(dateMax);
	console.log(`Getting emojis in channel ${textChannel.name} from between dates ${targetDateMin} and ${targetDateMax}.`);
	let emojis = [];
	const mostRecentMessageFromDateRange = await getMostRecentTextChannelMessageFromDateRange(textChannel, dateMin, dateMax);
	let message = mostRecentMessageFromDateRange;
	let count = 0;
	while (message) {
		if (!message.author.bot) {
			count++;
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write("Gathering emojis from " + count + " messages.");
			let messageEmojis = await getEmojisFromMessage(message);
			emojis = emojis.concat(messageEmojis);
		}
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
	process.stdout.write("Completed gathering emojis from " + count + " messages.");
	process.stdout.write("\n");
	cacheDaysOfEmoji(fullDaysToCache, emojis);
	return emojis;
}

const cacheDaysOfEmoji = (daysToCache, emojis) => {
	console.log('daysToCache:', daysToCache);
	console.log('emojis:', emojis);
};

const getEmojisFromMessage = async (message) => {
	const emojis = [];

	const customEmojisInContent = getCustomEmojiStringsFromString(message.content);
	for (const customEmoji of customEmojisInContent) {
		emojis.push({
			name: customEmoji.name,
			string: customEmoji.string,
			type: 'custom',
			usage: 'content',
			guild: message.channel.guild.id,
			channel: message.channel.id,
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
			guild: message.channel.guild.id,
			channel: message.channel.id,
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
				guild: message.channel.guild.id,
				channel: message.channel.id,
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

const client = new Discord.Client();

client.on("ready", async () => {
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
	await addGuildDatabaseCollection(hiveGuild);
	// await updateGuildDatabaseCollection(hiveGuild, {abc:123});
	console.log(await getGuildDatabaseCollection(hiveGuild));
});

client.on("message", async (message) => {
	// FOR TESTING SO IT ONLY RESPONDS TO ME
	const spirgelUserId = '273695758887157762';
	if (message.author.id === spirgelUserId) {
		if (message.content === "!emoji-report") {
			// message.channel.send("Crawling messages. This may take a while, I'll tag you when I'm finished.");
			message.channel.send("Test Start.");
			try {
				const databaseGuildCollection = await getGuildDatabaseCollection(message.channel.guild);
				if (databaseGuildCollection) {
					console.log('does not exist');
				}
				else {
					console.log('already exists');
				}
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
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const Discord = require('discord.js');
const emojiRegex = require('emoji-regex');
const nodeEmoji = require('node-emoji');

const DateHelpers = require('./classes/DateHelpers');
const EmojiCollectionInfoDocument = require('./classes/EmojiCollectionInfoDocument');
const EmojiDocument = require('./classes/EmojiDocument');

/*
*/

const generateEmojiCollectionName = (guildId, textChannelId, year, month, day) => {
	return 'guild:' + guildId + '_channel:' + textChannelId + '_date:' + year + '-' + month + '-' + day;
}

/*
*/

const isGuild = (guild) => {
	try {
		if (guild.constructor.name === 'Guild') {
			return true;
		}
	}
	catch (error) {}
	return false;
};
const getClientGuildById = (client, guildId) => {
	return client.guilds.cache.get(guildId);
};

const isTextChannel = (textChannel) => {
	try {
		if (textChannel.constructor.name === 'TextChannel') {
			return true;
		}
	}
	catch (error) {}
	return false;
};
const getGuildChannelById = (guild, channelId) => {
	return guild.channels.cache.get(channelId);
};

/*
*/

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

const getEmojiDatabaseCollectionDocuments = async (guildId, textChannelId, date, query = {}) => {
	const dateSegments = DateHelpers.getDateSegments(date);
	const collectionName = generateEmojiCollectionName(guildId, textChannelId, dateSegments.year, dateSegments.month, dateSegments.day);
	const results = await runMongoDatabaseCommands(async (database) => {
		const collection = await database.collection(collectionName);
		return await collection.find(query).toArray();
	});
	return results;
};

const setEmojiDatabaseCollectionDocuments = async (guildId, textChannelId, date, emojiDocuments) => {
	if (!Array.isArray(emojiDocuments)) {
		emojiDocuments = [emojiDocuments];
	}
	let emojiDocument;
	for (emojiDocument of emojiDocuments) {
		if (!EmojiDocument.isInstanceOfSelf(emojiDocument)) {
			throw new Error('emojiDocuments must only contain instances of the EmojiDocument class.');
		}
		if (emojiDocument.guildId !== guildId || emojiDocument.channelId !== textChannelId) {
			throw new Error('emojiDocuments guildId & channelId must matched those passed as parameters.');
		}
	}
	const dateSegments = DateHelpers.getDateSegments(date);
	const collectionName = generateEmojiCollectionName(guildId, textChannelId, dateSegments.year, dateSegments.month, dateSegments.day);
	await runMongoDatabaseCommands(async (database) => {
		const collection = await database.collection(collectionName);
		await collection.deleteMany({});
		await collection.insertMany(emojiDocuments);
	});
};

/*
*/

const generateEmojiReportStocks = async (parameters) => {
	let combinedDatesMinimum;
	let combinedDatesMaximum;
	if (parameters.date1Minimum <= DateHelpers.addMillisecondsToDate(parameters.date2Maximum, 1) &&
			parameters.date1Maximum >= DateHelpers.addMillisecondsToDate(parameters.date2Minimum, -1)) {
		if (parameters.date1Minimum <= parameters.date2Minimum) {
			combinedDatesMinimum = parameters.date1Minimum;
		}
		else {
			combinedDatesMinimum = parameters.date2Minimum;
		}
		if (parameters.date1Maximum >= parameters.date2Maximum) {
			combinedDatesMaximum = parameters.date1Maximum;
		}
		else {
			combinedDatesMaximum = parameters.date2Maximum;
		}
	}

	const textChannels = getTextChannelsFromLocations(parameters.locations);

	const emojiPromises = [];
	let textChannel;
	for (textChannel of textChannels) {
		if (combinedDatesMinimum && combinedDatesMaximum) {
			emojiPromises.push({
				channel: textChannel,
				dateMinimum: combinedDatesMinimum,
				dateMaximum: combinedDatesMaximum,
				promise: getTextChannelEmojisFromDateRange(textChannel, combinedDatesMinimum, combinedDatesMaximum, parameters.debug)
			});
		}
		else {
			emojiPromises.push({
				channel: textChannel,
				dateMinimum: parameters.date1Minimum,
				dateMaximum: parameters.date1Maximum,
				promise: getTextChannelEmojisFromDateRange(textChannel, parameters.date1Minimum, parameters.date1Maximum, parameters.debug)
			});
			emojiPromises.push({
				channel: textChannel,
				dateMinimum: parameters.date2Minimum,
				dateMaximum: parameters.date2Maximum,
				promise: getTextChannelEmojisFromDateRange(textChannel, parameters.date2Minimum, parameters.date2Maximum, parameters.debug)
			});
		}
	}

	let emoji = [];
	// resolve promises, add emoji to one giant array
	for (emojiPromise of emojiPromises) {}

	const range1GuildEmojis = getGuildEmojis(parameters.message.channel.guild);
	const range2GuildEmojis = getGuildEmojis(parameters.message.channel.guild);
	const range1UnicodeEmojis = [];
	const range2UnicodeEmojis = [];
	// loop through emoji array
};

const getTextChannelsFromLocations = (locationObjects) => {
	textChannels = [];
	if (!Array.isArray(locationObjects)) {
		locationObjects = [locationObjects];
	}
	for (item of locationObjects) {
		if (item.type === 'guild') {
			let guild;
			if (isGuild(item.location)) {
				guild = item.location;
			}
			const guildTextChannels = getTextChannelsFromGuild(guild);
			textChannels = textChannels.concat(guildTextChannels);
		}
		else if (item.type === 'textChannel') {
			if (isTextChannel(item.location)) {
				textChannels.push(item.location);
			}
		}
	}
	return textChannels;
}

const getTextChannelsFromGuild = (guild) => {
	const textChannels = [];
	if (isGuild(guild)) {
		let channel;
		for (channel of guild.channels.cache.array()) {
			if (isTextChannel(channel)) {
				textChannels.push(channel);
			}
		}
	}
	return textChannels;
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

const isEmojiCollectionCacheStale = async (client, emojiCollectionInfoDocument) => {
	const channel = client.channels.cache.get(emojiCollectionInfoDocument.channelId);
	
	const recentMessageThresholdCount = 100;
	const recentMessageThreshold = await getMostRecentTextChannelMessageFromDateRange(channel, 0, Date.now(), (-1 * recentMessageThresholdCount));
	const recentMessageThresholdDate = new Date(recentMessageThreshold.createdTimestamp);
	const recentDateThresholdDays = -2;
	const recentDateThresholdDate = DateHelpers.addDaysToDate(Date.now(), recentDateThresholdDays);
	if (emojiCollectionInfoDocument.date > recentMessageThresholdDate || emojiCollectionInfoDocument.date > recentDateThresholdDate) {
		return true;
	}

	const archiveDateThresholdDays = -15;
	const archiveDateThreshold = DateHelpers.addDaysToDate(Date.now(), archiveDateThresholdDays);
	const archiveCacheDateThresholdDays = 15;
	const archiveCacheDateThreshold = DateHelpers.addDaysToDate(emojiCollectionInfoDocument.date, archiveCacheDateThresholdDays);

	if (emojiCollectionInfoDocument.date < archiveDateThreshold && emojiCollectionInfoDocument.cachedDate < archiveCacheDateThreshold) {
		return true;
	}

	return false;
};

const getMostRecentTextChannelMessageFromDateRange = async (textChannel, dateMinimum, dateMaximum, offset = 0) => {

	if (offset < -100 || offset > 100) {
		throw new Error('offset cannot be larger than 100.');
	}
	
	const targetDateMinimum = new Date(dateMinimum);
	const targetDateMaximum = new Date(dateMaximum);
	
	const isMessageWithinRange = (message) => {
		if (message.createdTimestamp >= targetDateMinimum && message.createdTimestamp <= targetDateMaximum) {
			return true;
		}
		else {
			return false;
		}
	};

	const batchSize = 100;
	let batch;
	let match;
	let matchOlder;
	const mostRecentMessage = await textChannel.messages.fetch(textChannel.lastMessageID);
	if (isMessageWithinRange(mostRecentMessage)) {
		match = mostRecentMessage;
	}
	let lastMessageId = mostRecentMessage.id;

	while (!match) {
		// Get next batch of messages.
		batch = await textChannel.messages.fetch({
			before: lastMessageId,
			limit: batchSize
		});
		// Sort by most recent first.
		batch.sort((messageA, messageB) => {
			return messageB.createdTimestamp - messageA.createdTimestamp
		});
		// Find the most recent message from the target date range.
		match = batch.find(isMessageWithinRange);
		if (!match) {
			// Find any message created before the target date range.
			matchOlder = batch.find((message) => {
				if (new Date(message.createdTimestamp) < targetDateMinimum) {
					return true;
				}
			});
			if (matchOlder) {
				break;
			}
		}

		if (batch.last()) {
			lastMessageId = batch.last().id;
		}
		else {
			break;
		}
	}

	if (match) {
		let offsetBatch;
		if (offset === 0) {
			return match;
		}
		else if (offset > 0) {
			offsetBatch = await textChannel.messages.fetch({
				after: match.id,
				limit: offset
			});
			// Sort by oldest first.
			offsetBatch.sort((messageA, messageB) => {
				return messageA.createdTimestamp - messageB.createdTimestamp
			});
		}
		else if (offset < 0) {
			offsetBatch = await textChannel.messages.fetch({
				before: match.id,
				limit: Math.abs(offset)
			});
			// Sort by most recent first.
			offsetBatch.sort((messageA, messageB) => {
				return messageB.createdTimestamp - messageA.createdTimestamp
			});
		}
		const offsetMatch = offsetBatch.last();
		if (offsetMatch) {
			return offsetMatch;
		}
	}

	return match;
};

const crawlTextChannelEmojisFromDateRange = async (textChannel, dateMinimum, dateMaximum, debug = false) => {
	let emojis = [];
	const targetDateMinimum = new Date(dateMinimum);
	const targetDateMaximum = new Date(dateMaximum);
	
	if (debug) {
		console.log(`Crawling emojis in channel '${textChannel.name}' from between dates '${targetDateMinimum}' and '${targetDateMaximum}'.`);
	}

	const mostRecentMessageFromDateRange = await getMostRecentTextChannelMessageFromDateRange(textChannel, targetDateMinimum, targetDateMaximum);
	let message = mostRecentMessageFromDateRange;

	while (message) {
		let messageEmojis = await getEmojisFromMessage(message);
		emojis = emojis.concat(messageEmojis);

		let previousMessage = await textChannel.messages.fetch({
			before: message.id,
			limit: 1
		});
		message = null;
		previousMessage = previousMessage.first();
		if (previousMessage) {
			const previousMessageCreatedDate = new Date(previousMessage.createdTimestamp);
			if (previousMessageCreatedDate >= targetDateMinimum && previousMessageCreatedDate <= targetDateMaximum) {
				message = previousMessage;
			}
		}
	}

	if (debug) {
		console.log(`Finished crawling ${emojis.length} emojis in channel '${textChannel.name}' from between dates '${targetDateMinimum}' and '${targetDateMaximum}'.`);
	}

	return emojis;
}

const getTextChannelEmojisFromDateRange = async (textChannel, dateMinimum, dateMaximum, debug = false) => {
	if (debug) {
		console.log(`Getting emojis in channel '${textChannel.name}' from between dates '${dateMinimum}' and '${dateMaximum}'.`);
	}
	let emojis = [];
	const dateRangeDays = DateHelpers.getDateDaysFromRange(dateMinimum, dateMaximum);
	let dateRangeDay;
	runMongoDatabaseCommands(async (database) => {
		for (dateRangeDay of dateRangeDays) {
			const dateSegments = DateHelpers.getDateSegments(dateRangeDay);
			const emojiCollectionName = generateEmojiCollectionName(textChannel.guild.id, textChannel.id, dateSegments.year, dateSegments.month, dateSegments.day);
			const collection = await database.collection(emojiCollectionName);
			let collectionInfoDocument = await collection.findOne({collectionInfo: true});
			// Try using cached values.
			if (collectionInfoDocument) {
				const emojiCollectionCacheStale = await isEmojiCollectionCacheStale(collectionInfoDocument);
				if (!emojiCollectionCacheStale) {
					if (debug) {
						console.log(`Channel '${textChannel.name}' date '${dateRangeDay}' emoji cache is fresh.`);
					}
					const emojiDocuments = await collection.find({collectionInfo: false});
					emojis = emojis.concat(emojiDocuments);
					continue;
				}
			}
			if (debug) {
				console.log(`Channel '${textChannel.name}' date: '${dateRangeDay}' emoji cache is stale or non-existent.`);
			}
			// Crawl new values.
			await collection.deleteMany({});
			const crawledEmojis = await crawlTextChannelEmojisFromDateRange(textChannel, dateRangeDay, DateHelpers.getDateDayMaximumDate(dateRangeDay), debug);
			if (crawledEmojis.length) {
				await collection.insertMany(crawledEmojis);
				collectionInfoDocument = new EmojiCollectionInfoDocument({
					name: emojiCollectionName,
					guildId: textChannel.guild.id,
					channelId: textChannel.id,
					date: dateRangeDay.getTime(),
					cachedDate: Date.now(),
					cacheComplete: DateHelpers.isDateDayInThePast(dateRangeDay)
				}, true);
				await collection.insertOne(collectionInfoDocument);
				emojis = emojis.concat(crawledEmojis);
			}
		}
	});
	return emojis;
};

const getEmojisFromMessage = async (message) => {
	const emojis = [];

	if (!message.author.bot) {
		const customEmojisInContent = getCustomEmojiStringsFromString(message.content);
		for (const customEmoji of customEmojisInContent) {
			let emojiDocument = new EmojiDocument({
				name: customEmoji.name,
				string: customEmoji.string,
				type: 'custom',
				usage: 'content',
				guild: message.channel.guild.id,
				channel: message.channel.id,
				messageId: message.id,
				userId: message.author.id,
				createdDate: message.createdTimestamp
			});
			emojis.push(emojiDocument);
		}

		const unicodeEmojisInContent = getUnicodeEmojiStringsFromString(message.content);
		for (const unicodeEmoji of unicodeEmojisInContent) {
			let emojiDocument = new EmojiDocument({
				name: unicodeEmoji.name,
				string: unicodeEmoji.string,
				type: 'unicode',
				usage: 'content',
				guild: message.channel.guild.id,
				channel: message.channel.id,
				messageId: message.id,
				userId: message.author.id,
				createdDate: message.createdTimestamp
			});
			emojis.push(emojiDocument);
		}
	}

	for (const reaction of message.reactions.cache.array()) {
		const reactionUsers = await reaction.users.fetch();
		for (const user of reactionUsers.array()) {
			if (!user.bot) {
				let emojiObject = {
					name: '',
					string: '',
					type: '',
					usage: 'reaction',
					guild: message.channel.guild.id,
					channel: message.channel.id,
					messageId: message.id,
					userId: user.id,
					createdDate: message.createdTimestamp
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
				emojiObject = new EmojiDocument(emojiObject);
				emojis.push(emojiObject);
			}
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

/*
*/

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
});

discordClient.on("message", async (message) => {
	// FOR TESTING SO IT ONLY RESPONDS TO ME
	const spirgelUserId = '273695758887157762';
	if (!message.author.bot && message.author.id === spirgelUserId) {
		if (message.content.includes("!emoji-report help")) {
			message.reply([
				"I'm a bot that can show you various statistics about emoji usage on this server.",
				"Here are some commands you can choose from:",
				"",
				"`!emoji-report stocks`",
				"> Displays all custom emoji usage from the last 30 days, compared to their usage in the previous 30 days. Also displays the biggest winners and losers from the standard emoji set.",
				"",
				"... more coming soon."
			]);
		}
		else if (message.content.includes("!emoji-report stocks") || message.content.includes("!emoji-report stoncks")) {
			message.channel.send("Generating stocks report. This may take a while, I'll tag you when it's ready.");
			try {
				const spirgelsGuildId = '717413056086278196';
				const spirgelsGuild = discordClient.guilds.cache.get(spirgelsGuildId);
				const testChannelId = '717428158609096764';
				const testChannel = spirgelsGuild.channels.cache.get(testChannelId);
				const dateNow = DateHelpers.getDateWithoutTime(Date.now());
				const date30DaysPast = DateHelpers.addDaysToDate(dateNow, -2);
				const date60DaysPast = DateHelpers.addDaysToDate(dateNow, -12);
				generateEmojiReportStocks({
					client: discordClient,
					message: message,
					locations: {
						type: 'guild',
						location: message.channel.guild
					},
					date1Minimum: date30DaysPast,
					date1Maximum: dateNow,
					date2Minimum: date60DaysPast,
					date2Maximum: DateHelpers.addMillisecondsToDate(date30DaysPast, -1),
					debug: true
				});
			}
			catch (error) {
				message.reply("Uh-oh, something went wrong, contact Spirgel, I'm just a bot. ¯\\_(ツ)_/¯");
				console.error(error);
			}
		}
		else if (message.content === "!emoji-report kings" || message.content === "!emoji-report short-kings" || message.content === "!emoji-report queens" || message.content === "!emoji-report qweens") {
			// show who uses each emoji the most
		}
	}
});

discordClient.login(process.env.BOT_TOKEN);
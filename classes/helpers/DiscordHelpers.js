const DateHelpers = require('../helpers/DateHelpers');
const EmojiHelpers = require('../helpers/EmojiHelpers');
const DatabaseConnection = require('../database/DatabaseConnection');
const EmojiCollectionInfoDocument = require('../documents/EmojiCollectionInfoDocument');
const EmojiDocument = require('../documents/EmojiDocument');

const DiscordHelpers = class {
	static isGuild(guild) {
		try {
			if (guild.constructor.name === 'Guild') {
				return true;
			}
		}
		catch (error) {}
		return false;
	}
	static getClientGuildById(client, guildId) {
		return client.guilds.cache.get(guildId);
	}
	static isTextChannel(textChannel) {
		try {
			if (textChannel.constructor.name === 'TextChannel') {
				return true;
			}
		}
		catch (error) {}
		return false;
	}
	static getGuildChannelById(guild, channelId) {
		return guild.channels.cache.get(channelId);
	}
	static getGuildTextChannels(guild) {
		if (this.isGuild(guild)) {
			const textChannels = [];
			let channel;
			for (channel of guild.channels.cache.array()) {
				if (this.isTextChannel(channel)) {
					textChannels.push(channel);
				}
			}
			return textChannels;
		}
		else {
			throw new Error('Parameter guild must be a guild.');
		}
	}
	static generateEmojiCollectionName (guildId, textChannelId, year, month, day) {
		return 'guild:' + guildId + '_channel:' + textChannelId + '_date:' + year + '-' + month + '-' + day;
	}
	static async isEmojiCollectionCacheStale(channel, emojiCollectionInfoDocument) {
		/*
		Ok so this logic hurts my brain every time I try and parse it.
		Essentially this works as follows:
		1. If the cache was incomplete the last time it was run, this means the cache is stale.
			- Usually this happens if we tried to cache the current day and the day is not over yet.
		2. If the emoji collection (collections are grouped by day) is within the 100 most recent messages or within the past 2 days, it is stale.
			- Basically I am saying that I think it's not unreasonable to think that someone could add/remove an emoji:
				* if it's one of the 100 most recent messages OR
				* if the message is less than 2 days old
			- The 100 messages check is a good catch for inactive channels that will have a lot of the most recent messages be older than 2 days.
		3. If the emoji is older than 30 days and hasn't been cached since it became older than 30 days, it is stale.
			- I wanted some type of archive system.
			- After 30 days, if it hasn't been archive yet, archive it (by caching it again).
			- After this archive point, the cache will always be fresh.
		*/

		// if the latest cache was not completed
		// then the cache is stale
		if (!emojiCollectionInfoDocument.cacheComplete) {
			return true;
		}

		const recentMessageThresholdCount = -99;
		const recentMessageThreshold = await this.getMostRecentTextChannelMessageFromDateRange(channel, 0, Date.now(), (recentMessageThresholdCount));
		const recentMessageThresholdDate = new Date(recentMessageThreshold.createdTimestamp);
		const recentDateThresholdDays = -2;
		const recentDateThresholdDate = DateHelpers.addDaysToDate(Date.now(), recentDateThresholdDays);
		// if the emoji message date is newer than the 100 most recent message OR
		// if the emoji message date is newer than 2 days ago
		// then the cache is stale
		if (emojiCollectionInfoDocument.date > recentMessageThresholdDate || emojiCollectionInfoDocument.date > recentDateThresholdDate) {
			return true;
		}
	
		const archiveDateThresholdDays = 30;
		const archiveDateThreshold = DateHelpers.addDaysToDate(Date.now(), (-1 * archiveDateThresholdDays));
		const archiveCacheDateThreshold = DateHelpers.addDaysToDate(emojiCollectionInfoDocument.date, archiveDateThresholdDays);
		// if the emoji message date is older than 30 days ago AND
		// if the emoji was last cached less than 30 days after its creation
		// then the cache is stale
		if (emojiCollectionInfoDocument.date < archiveDateThreshold && emojiCollectionInfoDocument.cachedDate < archiveCacheDateThreshold) {
			return true;
		}
	
		return false;
	};
	static async getTextChannelEmojisFromDateRange(textChannel, dateMinimum, dateMaximum, forceBuildCache = false, debug = false) {
		if (debug) {
			console.log(`Getting emojis in channel '${textChannel.name}' from between dates ${new Date(dateMinimum)} and ${new Date(dateMaximum)}.`);
		}
		let emojis = [];

		try {
			const mostRecentMessageFromChannel = await textChannel.messages.fetch(textChannel.lastMessageID);
			if (mostRecentMessageFromChannel && mostRecentMessageFromChannel.createdTimestamp < dateMinimum) {
				console.log(`Most recent message in channel '${textChannel.name}' is from before the starting date of the specified date range.`);
				return emojis;
			}
		}
		catch (error) {
			// suppress
		}

		const dateRangeDays = DateHelpers.getDateDaysFromRange(dateMinimum, dateMaximum);

		const databaseConnection = new DatabaseConnection(debug);
		await databaseConnection.connect();
		const database = databaseConnection.getDatabase();

		for (let dateRangeDay of dateRangeDays) {
			const dateSegments = DateHelpers.getDateSegments(dateRangeDay);
			const emojiCollectionName = this.generateEmojiCollectionName(textChannel.guild.id, textChannel.id, dateSegments.year, dateSegments.month, dateSegments.day);
			const collection = await database.collection(emojiCollectionName);
			let collectionInfoDocument = await collection.findOne({collectionInfo: true});
			// Try using cached values.
			if (collectionInfoDocument) {
				const emojiCollectionCacheStale = await this.isEmojiCollectionCacheStale(textChannel, collectionInfoDocument);
				if (!emojiCollectionCacheStale && !forceBuildCache) {
					if (debug) {
						console.log(`Channel '${textChannel.name}' date '${dateRangeDay}' emoji cache is fresh.`);
					}
					let emojiDocuments = await collection.find({collectionInfo: false}).toArray();
					emojiDocuments = emojiDocuments.map((currentValue) => {
						return new EmojiDocument(currentValue);
					})
					emojis = emojis.concat(emojiDocuments);
					continue;
				}
			}
			if (debug) {
				console.log(`Channel '${textChannel.name}' date: '${dateRangeDay}' emoji cache is stale or non-existent.`);
			}
			// Crawl new values.
			await collection.deleteMany({});
			const crawledEmojis = await this.crawlTextChannelEmojisFromDateRange(textChannel, dateRangeDay, DateHelpers.getDateDayMaximumDate(dateRangeDay), debug);
			if (crawledEmojis) {
				collectionInfoDocument = new EmojiCollectionInfoDocument({
					name: emojiCollectionName,
					guildId: textChannel.guild.id,
					channelId: textChannel.id,
					date: dateRangeDay.getTime(),
					cachedDate: Date.now(),
					cacheComplete: DateHelpers.isDateDayInThePast(dateRangeDay)
				}, true);
				await collection.insertOne(collectionInfoDocument.data);
				collectionInfoDocument = await collection.findOne({collectionInfo: true});
				if (crawledEmojis.length > 0) {
					await collection.insertMany(crawledEmojis.map((currentValue) => {
						return currentValue.data;
					}));
					emojis = emojis.concat(crawledEmojis);
				}
			}
		}
		
		databaseConnection.close();
		return emojis;
	}
	static async getMostRecentTextChannelMessageFromDateRange(textChannel, dateMinimum, dateMaximum, offset = 0) {
		if (offset < -99 || offset > 99) {
			throw new Error('offset cannot be larger than 99.');
		}

		if (DateHelpers.isValidDate(dateMinimum)) {
			dateMinimum = new Date(dateMinimum);
		}
		else {
			throw new Error('Parameter dateMinimum must be a valid date.');
		}
		if (DateHelpers.isValidDate(dateMaximum)) {
			dateMaximum = new Date(dateMaximum);
		}
		else {
			throw new Error('Parameter dateMaximum must be a valid date.');
		}
		
		const isMessageWithinRange = (message) => {
			if (message.createdTimestamp >= dateMinimum && message.createdTimestamp <= dateMaximum) {
				return true;
			}
			return false;
		};
	
		const batchSize = 100;
		let batch;
		let match;
		let matchOlder;
		let mostRecentMessage;
		try {
			mostRecentMessage = await textChannel.messages.fetch(textChannel.lastMessageID);
			if (mostRecentMessage && isMessageWithinRange(mostRecentMessage)) {
				match = mostRecentMessage;
			}
			if (mostRecentMessage.createdTimestamp < dateMinimum) {
				console.log(`Most recent message in channel '${textChannel.name}' is from before the starting date of the specified date range.`);
				return null;
			}
		}
		catch (error) {
			// The last channel message was probably deleted, its id should still work for batch fetching though.
		}

		let batchLastMessageId = textChannel.lastMessageID;
	
		while (!match) {
			// Get next batch of messages.
			batch = await textChannel.messages.fetch({
				before: batchLastMessageId,
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
					if (new Date(message.createdTimestamp) < dateMinimum) {
						return true;
					}
				});
				if (matchOlder) {
					break;
				}
			}
	
			if (batch.last()) {
				batchLastMessageId = batch.last().id;
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
	}
	static async crawlTextChannelEmojisFromDateRange(textChannel, dateMinimum, dateMaximum, debug = false) {
		if (DateHelpers.isValidDate(dateMinimum)) {
			dateMinimum = new Date(dateMinimum);
		}
		else {
			throw new Error('Parameter dateMinimum must be a valid date.');
		}
		if (DateHelpers.isValidDate(dateMaximum)) {
			dateMaximum = new Date(dateMaximum);
		}
		else {
			throw new Error('Parameter dateMaximum must be a valid date.');
		}

		let emojis = [];
		
		if (debug) {
			console.log(`Crawling emojis in channel '${textChannel.name}' from between dates '${dateMinimum}' and '${dateMaximum}'.`);
		}
	
		const mostRecentMessageFromDateRange = await this.getMostRecentTextChannelMessageFromDateRange(textChannel, dateMinimum, dateMaximum);
		let message = mostRecentMessageFromDateRange;
	
		while (message) {
			let messageEmojis = await this.getEmojisFromMessage(message);
			if (messageEmojis.length > 0) {
				emojis = emojis.concat(messageEmojis);
			}
			let previousMessage = await textChannel.messages.fetch({
				before: message.id,
				limit: 1
			});
			message = null;
			previousMessage = previousMessage.first();
			if (previousMessage) {
				const previousMessageCreatedDate = new Date(previousMessage.createdTimestamp);
				if (previousMessageCreatedDate >= dateMinimum && previousMessageCreatedDate <= dateMaximum) {
					message = previousMessage;
				}
			}
		}
	
		if (debug) {
			console.log(`Finished crawling ${emojis.length} emojis in channel '${textChannel.name}' from between dates '${dateMinimum}' and '${dateMaximum}'.`);
		}
	
		return emojis;
	}
	static async getEmojisFromMessage(message) {
		const emojis = [];
	
		if (!message.author.bot) {
			const customEmojisInContent = EmojiHelpers.getCustomEmojiStringsFromString(message.content);
			for (const customEmoji of customEmojisInContent) {
				try {
					let emojiDocument = new EmojiDocument({
						name: customEmoji.name,
						string: customEmoji.string,
						type: 'custom',
						usage: 'content',
						guildId: message.channel.guild.id,
						channelId: message.channel.id,
						messageId: message.id,
						userId: message.author.id,
						createdDate: message.createdTimestamp
					}, true);
					emojis.push(emojiDocument);
				}
				catch(error) {
					console.error(error);
					console.log('from crawl (custom)');
					console.log(message);
				}
			}
	
			const unicodeEmojiInContent = EmojiHelpers.getUnicodeEmojiStringsFromString(message.content);
			for (const unicodeEmoji of unicodeEmojiInContent) {
				try {
					let emojiDocument = new EmojiDocument({
						string: unicodeEmoji.string,
						type: 'unicode',
						usage: 'content',
						guildId: message.channel.guild.id,
						channelId: message.channel.id,
						messageId: message.id,
						userId: message.author.id,
						createdDate: message.createdTimestamp
					}, true);
					emojis.push(emojiDocument);
				}
				catch(error) {
					console.error(error);
					console.log('from crawl (unicode)');
					console.log(message);
				}
			}
		}
	
		for (const reaction of message.reactions.cache.array()) {
			const reactionUsers = await reaction.users.fetch();
			for (const user of reactionUsers.array()) {
				if (!user.bot) {
					let emojiObject = {
						usage: 'reaction',
						guildId: message.channel.guild.id,
						channelId: message.channel.id,
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
						const unicodeEmoji = EmojiHelpers.getUnicodeEmojiStringsFromString(reaction.emoji.name);
						emojiObject.string = unicodeEmoji[0].string;
						emojiObject.type = 'unicode';
					}
					try {
						emojiObject = new EmojiDocument(emojiObject, true);
						emojis.push(emojiObject);
					}
					catch(error) {
						console.error(error);
						console.log('from crawl (reaction)');
						console.log(reaction.emoji);
					}
				}
			}
		}
	
		return emojis;
	}
	static getGuildEmojis(guild) {
		const emoji = [];
		guild.emojis.cache.each((guildEmoji) => {
			emoji.push({
				name: guildEmoji.name,
				id: guildEmoji.id,
				string: '<:' + guildEmoji.name + ':' + guildEmoji.id + '>',
				createdTimestamp: guildEmoji.createdTimestamp
			});
		});
		return emoji;
	};
	static groupMessages(messages) {
		const groupedMessages = [];
		const newlineString = "\n";
		const discordMessageCharacterLimit = 2000;
		let groupedMessage = '';
		for (const message of messages) {
			if (message.length <= discordMessageCharacterLimit) {
				if ((groupedMessage.length + message.length) <= (discordMessageCharacterLimit - newlineString.length)) {
					if (groupedMessage.length > 0) {
						groupedMessage += newlineString;
					}
					groupedMessage += message;
				}
				else {
					groupedMessages.push(groupedMessage);
					groupedMessage = message;
				}
			}
			else {
				throw new Error(`Any single message cannot exceed ${discordMessageCharacterLimit} characters.`);
			}
		}
		groupedMessages.push(groupedMessage);
		return groupedMessages;
	}
};
module.exports = DiscordHelpers;
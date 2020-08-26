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
		if (!emojiCollectionInfoDocument.cacheComplete) {
			return true;
		}

		const recentMessageThresholdCount = 100;
		const recentMessageThreshold = await DiscordHelpers.getMostRecentTextChannelMessageFromDateRange(channel, 0, Date.now(), (-1 * recentMessageThresholdCount));
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
	static async getTextChannelEmojisFromDateRange(textChannel, dateMinimum, dateMaximum, debug = false) {
		if (debug) {
			console.log(`Getting emojis in channel '${textChannel.name}' from between dates ${dateMinimum} and ${dateMaximum}.`);
		}
		let emojis = [];
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
				if (!emojiCollectionCacheStale) {
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
		if (offset < -100 || offset > 100) {
			throw new Error('offset cannot be larger than 100.');
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
					if (new Date(message.createdTimestamp) < dateMinimum) {
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
	
			const unicodeEmojiStringsInContent = EmojiHelpers.getUnicodeEmojiStringsFromString(message.content);
			for (const unicodeEmojiString of unicodeEmojiStringsInContent) {
				let emojiDocument = new EmojiDocument({
					string: unicodeEmojiString,
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
						const unicodeEmojiString = EmojiHelpers.getUnicodeEmojiStringsFromString(reaction.emoji.name);
						emojiObject.string = unicodeEmojiString[0];
						emojiObject.type = 'unicode';
					}
					emojiObject = new EmojiDocument(emojiObject, true);
					emojis.push(emojiObject);
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
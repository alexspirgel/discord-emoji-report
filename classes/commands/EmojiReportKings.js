const DiscordHelpers = require('../helpers/DiscordHelpers');
const DateHelpers = require('../helpers/DateHelpers');

const EmojiReportKings = class {

	static get temporaryCachedData() {
		return this._temporaryCachedData;
	}

	static set temporaryCachedData(data = {}) {
		this.temporaryCachedDataCachedTimestamp = Date.now();
		this.temporaryCachedDataDateMinimum = DateHelpers.addHoursToDate(data.dateMinimum, (-1 * this.temporaryCachedDataHoursFresh));
		this.temporaryCachedDataDateMaximum = DateHelpers.addHoursToDate(data.dateMaximum, (this.temporaryCachedDataHoursFresh));
		this._temporaryCachedData = data.data;
	}

	static get temporaryCachedDataCachedTimestamp() {
		return this._temporaryCachedDataCachedTimestamp;
	}

	static set temporaryCachedDataCachedTimestamp(timestamp) {
		this._temporaryCachedDataCachedTimestamp = timestamp;
	}

	static get temporaryCachedDataHoursFresh() {
		return 6;
	}

	static get isTemporaryCachedDataStale() {
		if (!this.temporaryCachedData) {
			return true;
		}
		const xHoursAgo = DateHelpers.addHoursToDate(Date.now(), (-1 * this.temporaryCachedDataHoursFresh));
		if (this.temporaryCachedDataCachedTimestamp < xHoursAgo) {
			return true;
		}
		return false;
	}

	constructor(parameters) {
		this.client = parameters.client;
		this.guild = parameters.guild;
		this.message = parameters.message;
		this.dateMinimum = parameters.dateMinimum;
		this.dateMaximum = parameters.dateMaximum;
		this.minimumUseThreshold = parameters.minimumUseThreshold ? parameters.minimumUseThreshold : 0;
		this.specificEmoji = parameters.specificEmoji ? parameters.specificEmoji : null;
		this.invalidateTemporaryCachedData = parameters.invalidateTemporaryCachedData;
		this.debug = parameters.debug;
	}

	get guild() {
		return this._guild;
	}

	set guild(guild) {
		if (DiscordHelpers.isGuild(guild)) {
			this._guild = guild;
			const guildChannels = DiscordHelpers.getGuildTextChannels(guild);
			let guildChannel;
			for (guildChannel of guildChannels) {
				this.addLocationTextChannel(guildChannel);
			}
		}
		else {
			throw new Error('The guild parameter must be a guild.');
		}
	}

	get locationTextChannels() {
		return this._locationTextChannels;
	}

	set locationTextChannels(textChannels) {
		this._locationTextChannels = textChannels;
	}

	addLocationTextChannel(textChannel) {
		if (!this.locationTextChannels) {
			this.locationTextChannels = [];
		}
		if (DiscordHelpers.isTextChannel(textChannel)) {
			if (!this.getLocationTextChannelById(textChannel.id)) {
				this.locationTextChannels.push(textChannel);
			}
		}
		else {
			throw new Error('Parameter textChannel must be a text channel.');
		}
	}

	getLocationTextChannelById(channelId) {
		let channel;
		for (channel of this.locationTextChannels) {
			if (channel.id === channelId) {
				return channel;
			}
			else {
				return null;
			}
		}
	}

	async generateOutput() {
		let messages = [];
		const emojis = await this.getEmojis();
		if (this.specificEmoji) {
			const specificEmojiKings = this.calculateSpecificEmojiKings(emojis, this.specificEmoji);
			const thisMessages = await this.generateSpecificKingsMessages(specificEmojiKings);
			messages = messages.concat(thisMessages);
		}
		else {
			const emojiKingsList = this.calculateAllKings(emojis);
			for (let emojiKingItem of emojiKingsList) {
				if (emojiKingItem.type === 'custom') {
					if (emojiKingItem.kings[0].count >= this.minimumUseThreshold) {
						const thisMessage = await this.generateAllKingsMessage(emojiKingItem);
						messages.push(thisMessage);
					}
				}
			}
			if (messages.length < 1) {
				messages.push('Not enough emojis used to declare any kings.');
			}
		}
		return DiscordHelpers.groupMessages(messages);
	}

	async getEmojis() {
		if (!this.constructor.isTemporaryCachedDataStale) {
			if (this.dateMinimum >= this.constructor.temporaryCachedDataDateMinimum &&
			this.dateMaximum <= this.constructor.temporaryCachedDataDateMaximum) {
				this.usingCachedResults = true;
				return this.constructor.temporaryCachedData;
			}
		}
		if (this.specificEmoji) {
			this.message.channel.send(`Generating ${this.specificEmoji.string} kings report. This may take a while, I'll tag you when it's ready.`);
		}
		else {
			this.message.channel.send("Generating kings report. This may take a while, I'll tag you when it's ready.");
		}
		let emojis = [];
		for (let locationTextChannel of this.locationTextChannels) {
			const emojiResults = await DiscordHelpers.getTextChannelEmojisFromDateRange(locationTextChannel, this.dateMinimum, this.dateMaximum, false, this.debug);
			if (emojiResults) {
				emojis = emojis.concat(emojiResults);
			}
		}
		this.constructor.temporaryCachedData = {
			data: emojis,
			dateMinimum: this.dateMinimum,
			dateMaximum: this.dateMaximum
		};
		return emojis;
	}

	calculateAllKings(emojis) {
		const emojisWithUserCounts = [];
		for (let emoji of emojis) {
			const userId = emoji.userId;
			const emojiString = emoji.string;
			const emojiType = emoji.type;
			if (userId && emojiString) {
				const existingEntry = emojisWithUserCounts.find((emojiCount) => {
					if (emojiCount.emojiString === emojiString) {return true;}
				});
				if (existingEntry) {
					const existingUserEntry = existingEntry.users.find((user) => {
						if (user.id === userId) {return true;}
					});
					if (existingUserEntry) {
						existingUserEntry.count = existingUserEntry.count + 1;
					}
					else {
						existingEntry.users.push({
							id: userId,
							count: 1
						});
					}
				}
				else {
					emojisWithUserCounts.push({
						emojiString: emojiString,
						type: emojiType,
						users: [
							{
								id: userId,
								count: 1
							}
						]
					});
				}
			}
		} // end for each emoji
		const emojiKings = emojisWithUserCounts.map((item) => {
			let kings = [];
			for (let user of item.users) {
				if (kings.length < 1) {
					kings.push(user);
				}
				else {
					if (user.count === kings[0].count) {
						kings.push(user);
					}
					else if (user.count > kings[0].count) {
						kings = [user];
					}
				}
			}
			return {
				emojiString: item.emojiString,
				type: item.type,
				kings: kings
			};
		});
		return emojiKings;
	}

	async generateAllKingsMessage(emojiKingItem) {
		let thisMessage = emojiKingItem.emojiString;
		thisMessage = thisMessage + '  **' + emojiKingItem.kings[0].count + '** ';
		for (let i = 0; i < emojiKingItem.kings.length; i++) {
			if (i > 0) {
				thisMessage = thisMessage + ',';
			}
			const thisKing = emojiKingItem.kings[i];
			const thisKingMember = await this.guild.members.fetch(thisKing.id);
			let name = thisKingMember.user.username;
			if (thisKingMember.nickname) {
				name = thisKingMember.nickname;
			}
			thisMessage = thisMessage + ' ' + name;
		}
		return thisMessage;
	}

	calculateSpecificEmojiKings(emojis, specificEmoji) {
		let userIdsAndEmojiCounts = [];
		for (let emoji of emojis) {
			const userId = emoji.userId;
			const emojiString = emoji.string;
			if (emojiString === specificEmoji.string) {
				const existingUserEntry = userIdsAndEmojiCounts.find((entry) => {
					if (entry.userId === userId) {
						return true;
					}
				});
				if (existingUserEntry) {
					existingUserEntry.count = existingUserEntry.count + 1;
				}
				else {
					userIdsAndEmojiCounts.push({
						userId: userId,
						count: 1
					});
				}
			}
		}
		userIdsAndEmojiCounts = userIdsAndEmojiCounts.sort((itemA, itemB) => {
			return itemB.count - itemA.count;
		});
		return userIdsAndEmojiCounts;
	}

	async generateSpecificKingsMessages(specificEmojiKings) {

		const getPlacementData = async (specificEmojiKings, startIndex) => {
			const data = {
				count: 0,
				users: [],
				endIndex: startIndex
			};
			let i;
			for (i = startIndex; i < specificEmojiKings.length; i++) {
				const thisEmojiKing = specificEmojiKings[i];
				if (i === startIndex) {
					data.count = thisEmojiKing.count;
				}
				if (thisEmojiKing.count === data.count) {
					const thisEmojiKingMember = await this.guild.members.fetch(thisEmojiKing.userId);
					const thisEmojiKingName = thisEmojiKingMember.nickname ? thisEmojiKingMember.nickname : thisEmojiKingMember.user.username;
					data.users.push(thisEmojiKingName);
				}
				else {
					break;
				}
			}
			data.endIndex = i;
			return data;
		}

		let messages = [];

		const firstPlacementData = await getPlacementData(specificEmojiKings, 0);
		if (firstPlacementData.users.length > 0) {
			messages.push(`${this.specificEmoji.string} Kings`);
			let firstPlaceMessage = "> :first_place:";
			firstPlaceMessage += ` **${firstPlacementData.count}** ||:crown:`;
			for (let userIndex = 0; userIndex < firstPlacementData.users.length; userIndex++) {
				const thisUser = firstPlacementData.users[userIndex];
				if (userIndex !== 0) {
					firstPlaceMessage += ',';
				}
				firstPlaceMessage += ` ${thisUser}`;
			}
			firstPlaceMessage += ` :crown:||`;
			messages.push(firstPlaceMessage);
		}
		else {
			messages.push(`There are no ${this.specificEmoji.string} Kings. There is not enough data.`);
		}
		
		const secondPlacementData = await getPlacementData(specificEmojiKings, firstPlacementData.endIndex);
		if (secondPlacementData.users.length > 0) {
			let secondPlaceMessage = "> :second_place:";
			secondPlaceMessage += ` **${secondPlacementData.count}** ||`;
			for (let userIndex = 0; userIndex < secondPlacementData.users.length; userIndex++) {
				const thisUser = secondPlacementData.users[userIndex];
				if (userIndex !== 0) {
					secondPlaceMessage += ',';
				}
				secondPlaceMessage += ` ${thisUser}`;
			}
			secondPlaceMessage += ` ||`;
			messages.push(secondPlaceMessage);
		}
		
		const thirdPlacementData = await getPlacementData(specificEmojiKings, secondPlacementData.endIndex);
		if (thirdPlacementData.users.length > 0) {
			let thirdPlaceMessage = "> :third_place:";
			thirdPlaceMessage += ` **${thirdPlacementData.count}** ||`;
			for (let userIndex = 0; userIndex < thirdPlacementData.users.length; userIndex++) {
				const thisUser = thirdPlacementData.users[userIndex];
				if (userIndex !== 0) {
					thirdPlaceMessage += ',';
				}
				thirdPlaceMessage += ` ${thisUser}`;
			}
			thirdPlaceMessage += ` ||`;
			messages.push(thirdPlaceMessage);
		}

		return messages;

	}

}

module.exports = EmojiReportKings;
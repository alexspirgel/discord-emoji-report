const DiscordHelpers = require('../helpers/DiscordHelpers');

/*
Notes
- emoji with less than 3 total uses during the time period 
*/

const EmojiReportKings = class {
	constructor(parameters) {
		this.client = parameters.client;
		this.guild = parameters.guild;
		this.dateMinimum = parameters.dateMinimum;
		this.dateMaximum = parameters.dateMaximum;
		this.minimumUseThreshold = parameters.minimumUseThreshold;
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
		const emojiKingsList = this.calculateKings(emojis);
		for (let emojiKingItem of emojiKingsList) {
			if (emojiKingItem.type === 'custom') {
				if (emojiKingItem.kings[0].count >= this.minimumUseThreshold) {
					const thisMessage = await this.generateMessage(emojiKingItem);
					messages.push(thisMessage);
				}
			}
		}
		if (messages.length < 1) {
			messages.push('Not enough emojis used to declare any kings.');
		}
		return DiscordHelpers.groupMessages(messages);
	}
	async getEmojis() {
		let emojis = [];
		for (let locationTextChannel of this.locationTextChannels) {
			const emojiResults = await DiscordHelpers.getTextChannelEmojisFromDateRange(locationTextChannel, this.dateMinimum, this.dateMaximum, false, this.debug);
			if (emojiResults) {
				emojis = emojis.concat(emojiResults);
			}
		}
		return emojis;
	}
	calculateKings(emojis) {
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
	async generateMessage(emojiKingItem) {
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
}

module.exports = EmojiReportKings;
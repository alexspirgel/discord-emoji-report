const EmojiObject = require('./classes/EmojiObject');

/**
 * @param {object} entry - A guild or a database collection object.
 */

const GuildDatabaseCollection = class {

	/**
	 * Date helpers. 
	 */

	static addDayToDate(date) {
		date = new Date(date);
		let nextDay = new Date(new Date(date).setDate(date.getDate() + 1));
		return nextDay;
	}
	static isDateToday(date) {
		const day = new Date(date).setHours(0,0,0,0);
		const today = new Date(Date.now()).setHours(0,0,0,0);
		if (day == today) {
			return true;
		}
		else {
			return false;
		}
	}
	static getDateWithoutTime(date) {
		return new Date(new Date(date).setHours(0,0,0,0));
	}
	static getDateSegments(date) {
		date = new Date(date);
		return {
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			day: date.getDate()
		};
	}

	/**
	 * Constructor.
	 */

	constructor(entry) {
		if (entry.constructor.name == 'Guild') {
			this.initializedFrom = 'guild';
			this.data = {};
			this.data.id = entry.id;
			this.data.name = entry.name;
			this.setTextChannelsFromGuild(entry);
		}
		else {
			this.initializedFrom = 'object';
			this.data = entry;
		}
	}

	/**
	 * Channel methods. 
	 */

	isTextChannel(channel) {
		if (channel.type === 'text') {
			return true;
		}
		else {
			return false;
		}
	}
	getTextChannelById(channelId, returnIndex = false) {
		const textChannels = this.getTextChannels();
		let i;
		let textChannel;
		for (i = 0; i < textChannels.length; i++) {
			textChannel = textChannels[i];
			if (textChannel.id === channelId) {
				if (returnIndex) {
					return i;
				}
				else {
					return textChannel;
				}
			}
		}
		return false;
	}
	getTextChannels() {
		if (!Array.isArray(this.data.textChannels)) {
			this.data.textChannels = [];
		}
		return this.data.textChannels;
	}
	addTextChannel(textChannel) {
		if (!this.getTextChannelById(textChannel)) {
			if (this.isTextChannel(textChannel)) {
				const textChannels = this.getTextChannels();
				textChannels.push({
					id: textChannel.id,
					name: textChannel.name,
					emojis: {}
				});
			}
		}
	}
	setTextChannelsFromGuild(guild) {
		this.removeAllChannels();
		let channel;
		for (channel of guild.channels.cache.array()) {
			if (this.isTextChannel(channel)) {
				this.addTextChannel(channel);
			}
		}
	}
	removeTextChannelById(channelId) {
		const textChannelIndex = this.getTextChannelById(channelId, true);
		if (textChannelIndex >= 0) {
			const textChannels = this.getTextChannels();
			textChannels.splice(textChannelIndex, 1);
		}
	}
	removeAllChannels() {
		this.data.textChannels = [];
	}

	/**
	 * Emoji methods
	 */

	isEmojiObject(emojiObject) {
		if (emojiObject instanceof EmojiObject) {
			return true;
		}
		else {
			return false;
		}
	}
	setEmojisByChannelDay(channelId, emojiObjects, fullDay = false) {
		const channel = this.getTextChannelById(channelId);
		if (channel && Array.isArray(emojiObjects)) {
			let emojiObject;
			let startTimestamp;
			let endTimestamp;
			for (emojiObject of emojiObjects) {
				if (this.isEmojiObject(emojiObject)) {
					// Code within this block should only run for one loop.
					if (!startTimestamp) {
						startTimestamp = emojiObject.getCreatedDate().setHours(0,0,0,0);
						startYear = emojiObject.getCreatedYear();
						startMonth = emojiObject.getCreatedMonth();
						startDay = emojiObject.getCreatedDay();
						endTimestamp = this.constructor.addDayToDate(emojiObject.getCreatedDate()).setHours(0,0,0,0);
						if (!channel.emojis[startYear]) {
							channel.emojis[startYear] = {};
						}
						if (!channel.emojis[startYear][startMonth]) {
							channel.emojis[startYear][startMonth] = {};
						}
						// Clear out previous data.
						channel.emojis[startYear][startMonth][startDay] = {};
						channel.emojis[startYear][startMonth][startDay].emojis = [];
						channel.emojis[startYear][startMonth][startDay].lastCachedTimestamp = Date.now();
						if (fullDay) {
							channel.emojis[startYear][startMonth][startDay].cacheComplete = true;
						}
					}
					// Code below should run every loop.
					if (emojiObject.createdTimestamp >= startTimestamp && emojiObject.createdTimestamp < endTimestamp) {
						channel.emojis[startYear][startMonth][startDay].emojis.push(emojiObject);
					}
				}
			}
		}
	}
	getEmojisByChannelDay(channelId, date) {
		date = this.constructor.getDateWithoutTime(date);
		const dateSegments = this.constructor.getDateSegments(date);
		const channel = this.getTextChannelById(channelId);
		if (channel) {
			try {
				return channel.emojis[dateSegments.year][dateSegments.month][dateSegments.day].emojis
			}
			catch (error) {
				return null;
			}
		}
	}
	getEmojisByChannelDateRange(channelId, dateMinimum, dateMaximum) {
		// TO-DO
	}
};

module.exports = GuildDatabaseCollection;

/*
{
	id: 111,
	name: 'guild name',
	textChannels: [
		{ // channel
			id: 222,
			name: 'channel name',
			emojis: {
				year: {
					month: {
						day: {
							lastCachedTimestamp: 123,
							cacheComplete: false,
							emojis: []
						}
					}
				}
			}
		}
	]
}
*/
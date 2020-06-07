const DateHelpers = require('./DateHelpers');
const EmojiCollectionInfoObject = require('./EmojiCollectionInfoObject');

/*
{
	name: 'Channel Name',
	channelId: '123456789',
	guildId: '123456789',
	emojiCollectionInfoObjects: []
}
*/

const TextChannelCollection = class {
	static isInstanceOfSelf(instance) {
		if (instance instanceof this) {
			return true;
		}
		else {
			return false;
		}
	}
	constructor(data, validate = false) {
		if (validate) {
			this.data = {};
			this.name = data.name;
			this.channelId = data.channelId;
			this.guildId = data.guildId;
			this.emojiCollectionInfoObjects = data.emojiCollectionInfoObjects;
		}
		else {
			this.data = data;
		}
	}
	set name(name) {
		try {
			if (name) {
				if (typeof name === 'string') {
					this.data.name = name;
				}
				else {
					throw new Error(this.constructor.name + ' name must be a string.');
				}
			}
			else {
				throw new Error(this.constructor.name + ' must have a name.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get name() {
		return this.data.name;
	}
	set channelId(channelId) {
		try {
			if (channelId) {
				if (typeof channelId === 'string') {
					this.data.channelId = channelId;
				}
				else {
					throw new Error(this.constructor.name + ' channelId must be a string.');
				}
			}
			else {
				throw new Error(this.constructor.name + ' must have a channelId.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get channelId() {
		return this.data.channelId;
	}
	set guildId(guildId) {
		try {
			if (guildId) {
				if (typeof guildId === 'string') {
					this.data.guildId = guildId;
				}
				else {
					throw new Error(this.constructor.name + ' guildId must be a string.');
				}
			}
			else {
				throw new Error(this.constructor.name + ' must have a guildId.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get guildId() {
		return this.data.guildId;
	}
	set emojiCollectionInfoObjects(emojiCollectionInfoObjects) {
		try {
			if (emojiCollectionInfoObjects) {
				if (Array.isArray(emojiCollectionInfoObjects)) {
					let i;
					let emojiCollectionInfoObject;
					for (i = 0; i < emojiCollectionInfoObjects.length; i++) {
						emojiCollectionInfoObject = emojiCollectionInfoObjects[i];
						if (!EmojiCollectionInfoObject.isInstanceOfSelf(emojiCollectionInfoObject)) {
							emojiCollectionInfoObject = new EmojiCollectionInfoObject(emojiCollectionInfoObject);
						}
					}
					this.data.emojiCollectionInfoObjects = emojiCollectionInfoObjects;
				}
				else {
					throw new Error(this.constructor.name + ' emojiCollectionInfoObjects must be an array.');
				}
			}
			else {
				this.data.emojiCollectionInfoObjects = [];
			}
		}
		catch (error) {
			throw error;
		}
	}
	get emojiCollectionInfoObjects() {
		return this.data.emojiCollectionInfoObjects;
	}
	getEmojiCollectionInfoObjectByDate(date, returnIndex = false) {
		const dateSegments = DateHelpers.getDateSegments(date);
		let i;
		let emojiCollectionInfoObject;
		for (i = 0; i < this.emojiCollectionInfoObjects.length; i++) {
			emojiCollectionInfoObject = this.emojiCollectionInfoObjects[i];
			if (emojiCollectionInfoObject.year === dateSegments.year &&
				emojiCollectionInfoObject.month === dateSegments.month &&
				emojiCollectionInfoObject.day === dateSegments.day) {
					if (returnIndex) {
						return i;
					}
					else {
						return emojiCollectionInfoObject;
					}
				}
		}
	}
	setEmojiCollectionInfoObject(date, lastCached, cacheComplete) {
		const existingEmojiCollectionInfoObject = getEmojiCollectionInfoObjectByDate(date);
		if (existingEmojiCollectionInfoObject) {
			existingEmojiCollectionInfoObject.lastCached = lastCached;
			existingEmojiCollectionInfoObject.cacheComplete = cacheComplete;
		}
		else {
			const dateSegments = DateHelpers.getDateSegments(date);
			const name = EmojiCollectionInfoObject.generateName(this.guildId, this.channelId, dateSegments.year, dateSegments.month, dateSegments.day);
			const emojiCollectionInfoObject = new EmojiCollectionInfoObject({
				name: name,
				channelId: this.guildId,
				guildId: this.channelId,
				year: dateSegments.year,
				month: dateSegments.month,
				day: dateSegments.day,
				lastCached: lastCached,
				cacheComplete: cacheComplete
			}, true);
			this.emojiCollectionInfoObjects.push(emojiCollectionInfoObject);
		}
	}
};

module.exports = TextChannelCollection;
const DateHelpers = require('./DateHelpers');
const EmojiCollectionInfoObject = require('./EmojiCollectionInfoObject');

/*
{
	name: 'Channel Name',
	channelId: '123456789',
	guildId: '123456789',
	emojiCollections: []
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
			this.emojiCollections = data.emojiCollections;
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
	set emojiCollections(emojiCollections) {
		try {
			if (emojiCollections) {
				if (Array.isArray(emojiCollections)) {
					let i;
					let emojiCollection;
					for (i = 0; i < emojiCollections.length; i++) {
						emojiCollection = emojiCollections[i];
						if (!EmojiCollectionInfoObject.isInstanceOfSelf(emojiCollection)) {
							emojiCollection = new EmojiCollectionInfoObject(emojiCollection);
						}
					}
					this.data.emojiCollections = emojiCollections;
				}
				else {
					throw new Error(this.constructor.name + ' emojiCollections must be an array.');
				}
			}
			else {
				this.data.emojiCollections = [];
			}
		}
		catch (error) {
			throw error;
		}
	}
	get emojiCollections() {
		return this.data.emojiCollections;
	}
};

module.exports = TextChannelCollection;
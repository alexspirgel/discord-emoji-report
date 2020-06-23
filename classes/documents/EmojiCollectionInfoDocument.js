/*
{
	collectionInfo: true,
	name: 'guild:123456789_channel:123456789_date:2020-1-21',
	guildId: '123456789',
	channelId: '123456789',
	date: 123,
	cachedDate: 123,
	cacheComplete: true
}
*/

const EmojiCollectionInfoDocument = class {
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
			this.data = {
				collectionInfo: true
			};
			this.name = data.name;
			this.guildId = data.guildId;
			this.channelId = data.channelId;
			this.date = data.date;
			this.cacheComplete = data.cacheComplete;
			if (data.cachedDate) {
				this.cachedDate = data.cachedDate;
			}
			else {
				this.cachedDate = Date.now();
			}
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
	set date(date) {
		try {
			if (date) {
				const timestamp = (new Date(date)).getTime();
				if (!Number.isNaN(timestamp)) {
					this.data.date = timestamp;
				}
				else {
					throw new Error(this.constructor.name + ' date must be a valid date.');
				}
			}
			else {
				throw new Error(this.constructor.name + ' must have a date.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get date() {
		return this.data.date;
	}
	set cachedDate(cachedDate) {
		try {
			if (cachedDate) {
				const timestamp = (new Date(cachedDate)).getTime();
				if (!Number.isNaN(timestamp)) {
					this.data.cachedDate = timestamp;
				}
				else {
					throw new Error(this.constructor.name + ' cachedDate must be a valid date.');
				}
			}
			else {
				throw new Error(this.constructor.name + ' must have a cachedDate.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get cachedDate() {
		return this.data.cachedDate;
	}
	set cacheComplete(cacheComplete) {
		try {
			if (typeof cacheComplete === 'boolean') {
				this.data.cacheComplete = cacheComplete;
			}
			else {
				throw new Error(this.constructor.name + ' must have a cacheComplete boolean value.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get cacheComplete() {
		return this.data.cacheComplete;
	}
};

module.exports = EmojiCollectionInfoDocument;
const DateHelpers = require('./DateHelpers');

/*
{
	name: '123456789-2020-1-21',
	channelId: '123456789',
	guildId: '123456789',
	year: 2020,
	month: 1,
	day: 21,
	lastCached: 123,
	cacheComplete: true
}
*/

const EmojiCollectionInfoObject = class {
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
			this.year = data.year;
			this.month = data.month;
			this.day = data.day;
			this.cacheComplete = data.cacheComplete;
			if (data.lastCached) {
				this.lastCached = data.lastCached;
			}
			else {
				this.lastCached = Date.now();
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
	set year(year) {
		try {
			if (year) {
				if (typeof year === 'number') {
					this.data.year = year;
				}
				else {
					throw new Error(this.constructor.name + ' year must be a number.');
				}
			}
			else {
				throw new Error(this.constructor.name + ' must have a year.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get year() {
		return this.data.year;
	}
	set month(month) {
		try {
			if (month) {
				if (typeof month === 'number') {
					this.data.month = month;
				}
				else {
					throw new Error(this.constructor.name + ' month must be a number.');
				}
			}
			else {
				throw new Error(this.constructor.name + ' must have a month.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get month() {
		return this.data.month;
	}
	set day(day) {
		try {
			if (day) {
				if (typeof day === 'number') {
					this.data.day = day;
				}
				else {
					throw new Error(this.constructor.name + ' day must be a number.');
				}
			}
			else {
				throw new Error(this.constructor.name + ' must have a day.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get day() {
		return this.data.day;
	}
	set lastCached(lastCached) {
		try {
			if (lastCached) {
				if (typeof lastCached === 'number' && (new Date(lastCached)).getTime() > 0) {
					this.data.lastCached = lastCached;
				}
				else {
					throw new Error(this.constructor.name + ' lastCached must be a timestamp.');
				}
			}
			else {
				throw new Error(this.constructor.name + ' must have a lastCached value.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get lastCached() {
		return this.data.lastCached;
	}
};

module.exports = EmojiCollectionInfoObject;
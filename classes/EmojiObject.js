/**
 * 
 */

const EmojiObject = class {
	constructor(data) {
		this.name = data.name;
		this.string = data.string;
		this.type = data.type;
		this.usage = data.usage;
		this.messageId = data.messageId;
		this.channelId = data.channelId;
		this.guildId = data.guildId;
		this.userId = data.userId;
		this.createdTimestamp = data.createdTimestamp;
	}
	set name(name) {
		try {
			if (name) {
				if (typeof name === 'string') {
					this._name = name;
				}
				else {
					throw new Error('EmojiObject name must be a string.');
				}
			}
			else {
				throw new Error('EmojiObject must have a name.');
			}
			
		}
		catch (error) {
			throw error;
		}
	}
	get name() {
		return this._name;
	}
	set string(string) {
		try {
			if (string) {
				if (typeof string === 'string') {
					this._string = string;
				}
				else {
					throw new Error('EmojiObject string must be a string.');
				}
			}
			else {
				throw new Error('EmojiObject must have a string.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get string() {
		return this._string;
	}
	set type(type) {
		try {
			if (type) {
				if (type === 'unicode' || type === 'custom') {
					this._type = type;
				}
				else {
					throw new Error('EmojiObject type must be \'unicode\' or \'custom\'.');
				}
			}
			else {
				throw new Error('EmojiObject must have a type.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get type() {
		return this._type;
	}
	set usage(usage) {
		try {
			if (usage) {
				if (usage === 'content' || usage === 'reaction') {
					this._usage = usage;
				}
				else {
					throw new Error('EmojiObject usage must be \'content\' or \'reaction\'.');
				}
			}
			else {
				throw new Error('EmojiObject must have a usage.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get usage() {
		return this._usage;
	}
	set messageId(messageId) {
		try {
			if (messageId) {
				if (typeof messageId === 'number') {
					this._messageId = messageId;
				}
				else {
					throw new Error('EmojiObject messageId must be a number.');
				}
			}
			else {
				throw new Error('EmojiObject must have a messageId.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get messageId() {
		return this._messageId;
	}
	set channelId(channelId) {
		try {
			if (channelId) {
				if (typeof channelId === 'number') {
					this._channelId = channelId;
				}
				else {
					throw new Error('EmojiObject channelId must be a number.');
				}
			}
			else {
				throw new Error('EmojiObject must have a channelId.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get channelId() {
		return this._channelId;
	}
	set guildId(guildId) {
		try {
			if (guildId) {
				if (typeof guildId === 'number') {
					this._guildId = guildId;
				}
				else {
					throw new Error('EmojiObject guildId must be a number.');
				}
			}
			else {
				throw new Error('EmojiObject must have a guildId.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get guildId() {
		return this._guildId;
	}
	set userId(userId) {
		try {
			if (userId) {
				if (typeof userId === 'number') {
					this._userId = userId;
				}
				else {
					throw new Error('EmojiObject userId must be a number.');
				}
			}
			else {
				throw new Error('EmojiObject must have a userId.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get userId() {
		return this._userId;
	}
	set createdTimestamp(createdTimestamp) {
		try {
			if (createdTimestamp) {
				if ((new Date(createdTimestamp)).getTime() > 0) {
					this._createdTimestamp = createdTimestamp;
				}
				else {
					throw new Error('EmojiObject createdTimestamp must be a timestamp.');
				}
			}
			else {
				throw new Error('EmojiObject must have a createdTimestamp.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get createdTimestamp() {
		return this._createdTimestamp;
	}
	/**
	 * 
	 */
	getCreatedDate() {
		return new Date(this.createdTimestamp);
	}
	getCreatedYear() {
		return this.getCreatedDate().getFullYear();
	}
	getCreatedMonth() {
		return this.getCreatedDate().getMonth() + 1;
	}
	getCreatedDay() {
		return this.getCreatedDate().getDate();
	}
};

module.exports = EmojiObject;
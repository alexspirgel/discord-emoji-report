/*
{
	name = 'name',
	string = '<:name:123456789>', // or unicode emoji string
	type = 'custom', // or 'unicode'
	usage = 'content', // or 'reaction'
	messageId = '123456789',
	channelId = '123456789',
	guildId = '123456789',
	userId = '123456789',
	createdTimestamp = 123456789
}
*/

const EmojiObject = class {
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
			this.string = data.string;
			this.type = data.type;
			this.usage = data.usage;
			this.messageId = data.messageId;
			this.channelId = data.channelId;
			this.guildId = data.guildId;
			this.userId = data.userId;
			this.createdTimestamp = data.createdTimestamp;
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
	set string(string) {
		try {
			if (string) {
				if (typeof string === 'string') {
					this.data.string = string;
				}
				else {
					throw new Error(this.constructor.name + ' string must be a string.');
				}
			}
			else {
				throw new Error(this.constructor.name + ' must have a string.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get string() {
		return this.data.string;
	}
	set type(type) {
		try {
			if (type) {
				if (type === 'unicode' || type === 'custom') {
					this.data.type = type;
				}
				else {
					throw new Error(this.constructor.name + ' type must be \'unicode\' or \'custom\'.');
				}
			}
			else {
				throw new Error(this.constructor.name + ' must have a type.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get type() {
		return this.data.type;
	}
	set usage(usage) {
		try {
			if (usage) {
				if (usage === 'content' || usage === 'reaction') {
					this.data.usage = usage;
				}
				else {
					throw new Error(this.constructor.name + ' usage must be \'content\' or \'reaction\'.');
				}
			}
			else {
				throw new Error(this.constructor.name + ' must have a usage.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get usage() {
		return this.data.usage;
	}
	set messageId(messageId) {
		try {
			if (messageId) {
				if (typeof messageId === 'string') {
					this.data.messageId = messageId;
				}
				else {
					throw new Error(this.constructor.name + ' messageId must be a string.');
				}
			}
			else {
				throw new Error(this.constructor.name + ' must have a messageId.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get messageId() {
		return this.data.messageId;
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
	set userId(userId) {
		try {
			if (userId) {
				if (typeof userId === 'string') {
					this.data.userId = userId;
				}
				else {
					throw new Error(this.constructor.name + ' userId must be a string.');
				}
			}
			else {
				throw new Error(this.constructor.name + ' must have a userId.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get userId() {
		return this.data.userId;
	}
	set createdTimestamp(createdTimestamp) {
		try {
			if (createdTimestamp) {
				if (typeof createdTimestamp === 'number' && (new Date(createdTimestamp)).getTime() > 0) {
					this.data.createdTimestamp = createdTimestamp;
				}
				else {
					throw new Error(this.constructor.name + ' createdTimestamp must be a timestamp.');
				}
			}
			else {
				throw new Error(this.constructor.name + ' must have a createdTimestamp.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get createdTimestamp() {
		return this.data.createdTimestamp;
	}
};

module.exports = EmojiObject;
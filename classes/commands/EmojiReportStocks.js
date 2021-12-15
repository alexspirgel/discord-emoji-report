const DateHelpers = require('../helpers/DateHelpers');
const DiscordHelpers = require('../helpers/DiscordHelpers');

/*
client: Client,
locations: Guild,
date1Minimum: '2020-5-15',
date1Maximum: '2020-6-15',
date2Minimum: '2020-5-14',
date2Maximum: '2020-4-15',
debug: false
*/

const EmojiReportStocks = class {
	constructor(parameters) {
		this.client = parameters.client;
		this.locations = parameters.locations;
		this.date1Minimum = parameters.date1Minimum;
		this.date1Maximum = parameters.date1Maximum;
		this.date2Minimum = parameters.date2Minimum;
		this.date2Maximum = parameters.date2Maximum;
		this.debug = parameters.debug;
	}
	set client(client) {
		try {
			if (client) {
				if (client.constructor.name === 'Client') {
					this._client = client;
				}
				else {
					throw new Error(this.constructor.name + ' client parameter must be an instance of Client.');
				}
			}
			else {
				throw new Error(this.constructor.name + ' client parameter must be passed.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get client() {
		return this._client;
	}
	validateDateParameter(date, parameterName) {
		try {
			if (date) {
				if (DateHelpers.isValidDate(date)) {
					return true;
				}
				else {
					throw new Error(this.constructor.name + ' ' + parameterName + ' parameter must be a valid date or a string/number that resolves to a valid date.');
				}
			}
			else {
				throw new Error(this.constructor.name + ' ' + parameterName + ' parameter must be passed.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	set date1Minimum(date1Minimum) {
		if (this.validateDateParameter(date1Minimum, 'date1Minimum')) {
			this._date1Minimum = date1Minimum;
		}
		this.updateCombinedRange();
	}
	get date1Minimum() {
		return this._date1Minimum;
	}
	set date1Maximum(date1Maximum) {
		if (this.validateDateParameter(date1Maximum, 'date1Maximum')) {
			this._date1Maximum = date1Maximum;
		}
		this.updateCombinedRange();
	}
	get date1Maximum() {
		return this._date1Maximum;
	}
	set date2Minimum(date2Minimum) {
		if (this.validateDateParameter(date2Minimum, 'date2Minimum')) {
			this._date2Minimum = date2Minimum;
		}
		this.updateCombinedRange();
	}
	get date2Minimum() {
		return this._date2Minimum;
	}
	set date2Maximum(date2Maximum) {
		if (this.validateDateParameter(date2Maximum, 'date2Maximum')) {
			this._date2Maximum = date2Maximum;
		}
		this.updateCombinedRange();
	}
	get date2Maximum() {
		return this._date2Maximum;
	}
	set combinedMinimum(combinedMinimum) {
		try {
			if (combinedMinimum) {
				if (!DateHelpers.isValidDate(combinedMinimum)) {
					throw new Error(this.constructor.name + ' combinedMinimum parameter must be a valid date or a string/number that resolves to a valid date.');
				}
			}
			this._combinedMinimum = combinedMinimum;
		}
		catch (error) {
			throw error;
		}
	}
	get combinedMinimum() {
		return this._combinedMinimum;
	}
	set combinedMaximum(combinedMaximum) {
		try {
			if (combinedMaximum) {
				if (!DateHelpers.isValidDate(combinedMaximum)) {
					throw new Error(this.constructor.name + ' combinedMaximum parameter must be a valid date or a string/number that resolves to a valid date.');
				}
			}
			this._combinedMaximum = combinedMaximum;
		}
		catch (error) {
			throw error;
		}
	}
	get combinedMaximum() {
		return this._combinedMaximum;
	}
	updateCombinedRange() {
		const combinedRange = DateHelpers.getSingleDateRangeFromOverlappingDateRanges(this.date1Minimum, this.date1Maximum, this.date2Minimum, this.date2Maximum);
		if (combinedRange) {
			this.combinedMinimum = combinedRange.minimum;
			this.combinedMaximum = combinedRange.maximum;
		}
		else {
			this.combinedMinimum = null;
			this.combinedMaximum = null;
		}
	}
	get dateRanges() {
		if (this.combinedMinimum && this.combinedMaximum) {
			return [
				{
					minimum: this.combinedMinimum,
					maximum: this.combinedMaximum
				}
			];
		}
		else {
			return [
				{
					minimum: this.date1Minimum,
					maximum: this.date1Maximum
				},
				{
					minimum: this.date2Minimum,
					maximum: this.date2Maximum
				}
			];
		}
	}
	set debug(debug) {
		try {
			if (debug === undefined || typeof debug === 'boolean') {
				this._debug = debug;
			}
			else {
				throw new Error(this.constructor.name + ' debug parameter must be undefined or a boolean.');
			}
		}
		catch (error) {
			throw error;
		}
	}
	get debug() {
		return this._debug;
	}
	set locations(locations) {
		if (!Array.isArray(locations)) {
			locations = [locations];
		}
		for (let location of locations) {
			if (DiscordHelpers.isGuild(location)) {
				const guildChannels = DiscordHelpers.getGuildTextChannels(location);
				let guildChannel;
				for (guildChannel of guildChannels) {
					this.addLocationTextChannel(guildChannel);
				}
			}
			else if (DiscordHelpers.isTextChannel(location)) {
				this.addLocationTextChannel(guildChannel);
			}
			else {
				throw new Error('Each location in locations parameter of ' + this.constructor.name + ' must be a guild or a text channel.');
			}
		}
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
	get locationTextChannels() {
		return this._locationTextChannels;
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
	async getEmojis() {
		let emojis = [];
		for (let locationTextChannel of this.locationTextChannels) {
			for (let dateRange of this.dateRanges) {
				const emojiResults = await DiscordHelpers.getTextChannelEmojisFromDateRange(locationTextChannel, dateRange.minimum, dateRange.maximum, false, this.debug);
				if (emojiResults) {
					emojis = emojis.concat(emojiResults);
				}
			}
		}
		return emojis;
	}
	generateEmojiCountList(emojis) {
		const emojiCountList = [];
		for (let emoji of emojis) {
			let listEmoji = emojiCountList.find((listEmoji) => {
				if (emoji.string === listEmoji.string) {
					return true;
				}
			});

			if (!listEmoji) {
				listEmoji = {
					string: emoji.string,
					range1Count: 0,
					range2Count: 0
				};
				if (emoji.type === 'custom') {
					listEmoji.type = 'custom';
				}
				else if (emoji.type === 'unicode') {
					listEmoji.type = 'unicode';
				}
				emojiCountList.push(listEmoji);
			}

			if (DateHelpers.isDateWithinRange(emoji.createdDate, this.date1Minimum, this.date1Maximum)) {
				listEmoji.range1Count++;
			}
			else if (DateHelpers.isDateWithinRange(emoji.createdDate, this.date2Minimum, this.date2Maximum)) {
				listEmoji.range2Count++;
			}
		}
		const compare = (a, b) => {
			const differenceA = a.range1Count - a.range2Count;
			const differenceB = b.range1Count - b.range2Count;
			if (differenceA < differenceB) {
				return 1;
			}
			else if (differenceA > differenceB) {
				return -1;
			}
			else {
				return 0;
			}
		};
		emojiCountList.sort(compare);
		return emojiCountList;
	}
	generateMessage(emojiCountListItem) {
		const roundPercent = (number) => {
			return Math.round((number + Number.EPSILON) * 100) / 100;
		};

		let thisMessage = emojiCountListItem.string;

		thisMessage = thisMessage + '  **' + emojiCountListItem.range1Count + '**  ';

		const difference = emojiCountListItem.range1Count - emojiCountListItem.range2Count;
		thisMessage = thisMessage + " "
		if (difference > 0) {
			thisMessage = thisMessage + "+";
		}
		thisMessage = thisMessage + difference.toString();

		if (emojiCountListItem.range2Count === 0) {
			thisMessage = thisMessage + " (from 0) ▲";
		}
		else {
			const percent = ((difference / emojiCountListItem.range2Count) * 100);
			thisMessage = thisMessage + " (" + Math.abs(roundPercent(percent)).toString() + "%)";
			if (difference > 0) {
				thisMessage = thisMessage + " ▲";
			}
			else if (difference < 0) {
				thisMessage = thisMessage + " ▼";
			}
		}
		return thisMessage;
	}
	async generateOutput() {
		let messages = [];

		const emojis = await this.getEmojis();
		const emojiCountList = this.generateEmojiCountList(emojis);
		const emojiCustomCountList = emojiCountList.filter((element) => {
			if (element.type === 'custom') {
				return true;
			}
		});
		const emojiUnicodeCountList = emojiCountList.filter((element) => {
			if (element.type === 'unicode') {
				return true;
			}
		});
		// console.log('emojiUnicodeCountList');
		// console.log(emojiUnicodeCountList);
		
		for (let emojiCountListItem of emojiCustomCountList) {
			const thisMessage = this.generateMessage(emojiCountListItem);
			messages.push(thisMessage);
		}
		
		// if (emojiUnicodeCountList.length >= 10) {
		// 	for (let i = 0; i < 4; i++) {}
		// 	for (let i = (emojiUnicodeCountList.length - 1); i > (emojiUnicodeCountList.length - 5); i--) {}
		// }
		return DiscordHelpers.groupMessages(messages);
	}
};

module.exports = EmojiReportStocks;
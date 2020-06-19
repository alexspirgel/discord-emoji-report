const DateHelpers = require('./DateHelpers');
const DiscordHelpers = require('./DiscordHelpers');

const EmojiCollectionHelpers = class {
	static generateEmojiCollectionName (guildId, textChannelId, year, month, day) {
		return 'guild:' + guildId + '_channel:' + textChannelId + '_date:' + year + '-' + month + '-' + day;
	}
	static async isEmojiCollectionCacheStale(channel, emojiCollectionInfoDocument) {
		if (!emojiCollectionInfoDocument.cacheComplete) {
			return true;
		}
	
		const recentMessageThresholdCount = 100;
		const recentMessageThreshold = await DiscordHelpers.getMostRecentTextChannelMessageFromDateRange(channel, 0, Date.now(), (-1 * recentMessageThresholdCount));
		const recentMessageThresholdDate = new Date(recentMessageThreshold.createdTimestamp);
		const recentDateThresholdDays = -2;
		const recentDateThresholdDate = DateHelpers.addDaysToDate(Date.now(), recentDateThresholdDays);
		if (emojiCollectionInfoDocument.date > recentMessageThresholdDate || emojiCollectionInfoDocument.date > recentDateThresholdDate) {
			return true;
		}
	
		const archiveDateThresholdDays = -15;
		const archiveDateThreshold = DateHelpers.addDaysToDate(Date.now(), archiveDateThresholdDays);
		const archiveCacheDateThresholdDays = 15;
		const archiveCacheDateThreshold = DateHelpers.addDaysToDate(emojiCollectionInfoDocument.date, archiveCacheDateThresholdDays);
	
		if (emojiCollectionInfoDocument.date < archiveDateThreshold && emojiCollectionInfoDocument.cachedDate < archiveCacheDateThreshold) {
			return true;
		}
	
		return false;
	};
};

module.exports = EmojiCollectionHelpers;
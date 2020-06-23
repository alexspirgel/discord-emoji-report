const emojiRegex = require('emoji-regex');

const EmojiHelpers = class {
	static getCustomEmojiNameFromCustomEmojiString(customEmojiString) {
		const regex = /(?<=<:)(.*)(?=:\d+>)/;
		return customEmojiString.match(regex)[0];
	}
	static getCustomEmojiIdFromCustomEmojiString(customEmojiString) {
		const regex = /(?<=:)(\d*)(?=>)/;
		return customEmojiString.match(regex)[0];
	}
	static getCustomEmojiStringsFromString(string) {
		const regex = /<:[^:\s]*(?:::[^:\s]*)*:\d+>/g;
		const regexMatches = string.match(regex);
		const matches = [];
		let match;
		if (regexMatches) {
			for (match of regexMatches) {
				matches.push({
					name: this.getCustomEmojiNameFromCustomEmojiString(match),
					string: match
				});
			}
		}
		return matches;
	}
	static getUnicodeEmojiStringsFromString(string) {
		const regex = emojiRegex();
		const matches = [];
		let match;
		while (match = regex.exec(string)) {
			matches.push(match[0]);
		}
		return matches;
	}
};

module.exports = EmojiHelpers;
const emojiRegex = require('emoji-regex');

const additionalEmojiRegex = /☹|⚔|♥|☠|✡|❤|☺|™/g

const emojiErrors = [
	{
		string: '�',
		name: ':eye:',
		instances: [
			{
				type: 'reaction',
				messageId: '497458577284399150',
				channelId: '231204322145337344'
			}
		]
	},
	{
		string: '�',
		name: ':hole:',
		instances: [
			{
				type: 'reaction',
				messageId: '511705983987351552',
				channelId: '231204322145337344'
			}
		]
	}
];

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
		let matches = [];
		let match;
		const regex = emojiRegex();
		while (match = regex.exec(string)) {
			matches.push(match[0]);
		}

		const additionalMatches = [];
		let additionalMatch;
		const additionalRegex = additionalEmojiRegex;
		while (additionalMatch = additionalRegex.exec(string)) {
			if (!matches.includes(additionalMatch)) {
				additionalMatches.push(additionalMatch[0]);
			}
		}

		matches = matches.concat(additionalMatches);
		return matches;
	}
};

module.exports = EmojiHelpers;
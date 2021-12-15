const emojiRegex = require('emoji-regex');

const additionalEmojiRegex = /☹|⚔|♥|☠|✡|❤|☺|™|✔|☎|2⃣|7⃣|3⃣|0⃣|➡|⬅|⚖|▶|❄|✝|☮/g

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
	},
	{
		string: '�',
		name: ':b:',
		instances: [
			{
				type: 'reaction',
				messageId: '619305858873950243',
				channelId: '231204322145337344'
			}
		]
	},
	{
		string: '�',
		name: ':a:',
		instances: [
			{
				type: 'reaction',
				messageId: '630801563182563330',
				channelId: '231204322145337344'
			}
		]
	},
	{
		string: '�',
		name: ':o:',
		instances: [
			{
				type: 'reaction',
				messageId: '591630234655129616',
				channelId: '316312140350881803'
			}
		]
	},
	{
		string: '�',
		name: ':hot_pepper:',
		instances: [
			{
				type: 'reaction',
				messageId: '576034836502937620',
				channelId: '341710270701371393'
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
const DateHelpers = class {
	static isValidDate(date) {
		const timestamp = (new Date(date)).getTime();
		if (!Number.isNaN(timestamp)) {
			return true;
		}
		else {
			return false;
		}
	}
	static addDaysToDate(date, days) {
		date = new Date(date);
		return new Date(new Date(date).setDate(date.getDate() + days));
	}
	static addHoursToDate(date, hours) {
		date = new Date(date);
		return new Date(new Date(date).setHours(date.getHours() + hours));
	}
	static addMillisecondsToDate(date, milliseconds) {
		date = new Date(date);
		return new Date((date.getTime()) + milliseconds);
	}
	static getDateDayMaximumDate(date) {
		const dateNextDay = this.addDaysToDate(date, 1);
		return this.addMillisecondsToDate(dateNextDay, -1);
	}
	static isDateDayInThePast(date) {
		const day = new Date(date).setHours(0,0,0,0);
		const today = new Date(Date.now()).setHours(0,0,0,0);
		if (day >= today) {
			return false;
		}
		else {
			return true;
		}
	}
	static getDateWithoutTime(date) {
		return new Date(new Date(date).setHours(0,0,0,0));
	}
	static getDateYear(date) {
		date = new Date(date);
		return date.getFullYear();
	}
	static getDateMonth(date) {
		date = new Date(date);
		return date.getMonth() + 1;
	}
	static getDateDay(date) {
		date = new Date(date);
		return date.getDate();
	}
	static getDateSegments(date) {
		return {
			year: this.getDateYear(date),
			month: this.getDateMonth(date),
			day: this.getDateDay(date)
		};
	}
	static isDateWithinRange(date, dateMinimum, dateMaximum) {
		date = new Date(date);
		dateMinimum = new Date(dateMinimum);
		dateMaximum = new Date(dateMaximum);
		if (date >= dateMinimum && date <= dateMaximum) {
			return true;
		}
		else {
			return false;
		}
	};
	static getDateDaysFromRange(dateMinimum, dateMaximum) {
		const dateDayMinimum = this.getDateWithoutTime(dateMinimum);
		const dateDayMaximum = this.getDateWithoutTime(dateMaximum);
		const dayDates = [];
		let date;
		for (date = dateDayMinimum; date <= dateDayMaximum; date = this.addDaysToDate(date, 1)) {
			dayDates.push(date);
		}
		return dayDates;
	}
	static getSingleDateRangeFromOverlappingDateRanges(date1Minimum, date1Maximum, date2Minimum, date2Maximum) {
		if (this.isValidDate(date1Minimum) && this.isValidDate(date1Maximum) && this.isValidDate(date2Minimum) && this.isValidDate(date2Maximum)) {
			if (date1Minimum <= this.addMillisecondsToDate(date2Maximum, 1) && date1Maximum >= this.addMillisecondsToDate(date2Minimum, -1)) {
				const range = {};
				range.minimum = date1Minimum;
				range.maximum = date1Maximum;
				if (date2Minimum < range.minimum) {
					range.minimum = date2Minimum;
				}
				if (date2Maximum > range.maximum) {
					range.maximum = date2Maximum;
				}
				return range;
			}
		}
		return false;
	}
	static millisecondsToString(duration) {
		let string = '';
		// const milliseconds = parseInt((duration % 1000) / 100);
		const seconds = Math.floor((duration / 1000) % 60);
		const minutes = Math.floor((duration / (1000 * 60)) % 60);
		const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
		if (hours) {
			string += hours + ' hour';
			if (hours > 1) {
				string += 's'
			}
		}
		if (minutes) {
			if (string) {
				string += ', '
			}
			string += minutes + ' minute';
			if (minutes > 1) {
				string += 's'
			}
		}
		if (seconds) {
			if (string) {
				string += ', '
			}
			string += seconds + ' second';
			if (seconds > 1) {
				string += 's'
			}
		}
		return string;
	}
}

module.exports = DateHelpers;
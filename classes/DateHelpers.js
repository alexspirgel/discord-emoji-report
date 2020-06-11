const DateHelpers = class {
	static addDaysToDate(date, days) {
		date = new Date(date);
		return new Date(new Date(date).setDate(date.getDate() + days));
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
		dateMinimum = new Date(dateMinimum);
		dateMaximum = new Date(dateMaximum);
		date = new Date(date);
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
}

module.exports = DateHelpers;
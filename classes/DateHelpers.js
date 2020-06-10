const DateHelpers = class {
	static addDaysToDate(date, days) {
		date = new Date(date);
		let newDate = new Date(new Date(date).setDate(date.getDate() + days));
		return newDate;
	}
	static isDateToday(date) {
		const day = new Date(date).setHours(0,0,0,0);
		const today = new Date(Date.now()).setHours(0,0,0,0);
		if (day == today) {
			return true;
		}
		else {
			return false;
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
	static isDateWithinRange (date, dateMinimum, dateMaximum) {
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
	static getDayDatesFromRange(dateMinimum, dateMaximum) {
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
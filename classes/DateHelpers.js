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
	static getDateSegments(date) {
		date = new Date(date);
		return {
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			day: date.getDate()
		};
	}
	static isDateWithinRange (dateMin, dateMax, date) {
		dateMin = new Date(dateMin);
		dateMax = new Date(dateMax);
		date = new Date(date);
		if (date >= dateMin && date <= dateMax) {
			return true;
		}
		else {
			return false;
		}
	};
}

module.exports = DateHelpers;
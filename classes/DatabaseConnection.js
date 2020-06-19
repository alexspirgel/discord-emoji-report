require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;

const DatabaseConnection = class {
	constructor(debug) {
		this.connectionUrl = process.env.DATABASE_URL;
		this.connectionOptions = {
			useUnifiedTopology: true
		};
		this.databaseName = process.env.DATABASE_NAME;
		this.debug = debug;
	}
	set connectionUrl(connectionUrl) {
		if (connectionUrl) {
			if (typeof connectionUrl === 'string') {
				this._connectionUrl = connectionUrl;
			}
			else {
				throw new Error(this.constructor.name + ' connectionUrl must be a string.');
			}
		}
		else {
			throw new Error(this.constructor.name + ' must have a connectionUrl.');
		}
	}
	get connectionUrl() {
		return this._connectionUrl;
	}
	set connectionOptions(connectionOptions) {
		if (connectionOptions) {
			if (typeof connectionOptions === 'object') {
				this._connectionOptions = connectionOptions;
			}
			else {
				throw new Error(this.constructor.name + ' connectionOptions must be an object.');
			}
		}
		else {
			throw new Error(this.constructor.name + ' must have connectionOptions.');
		}
	}
	get connectionOptions() {
		return this._connectionOptions;
	}
	set debug(debug) {
		if (debug !== undefined) {
			if (typeof debug === 'boolean') {
				this._debug = debug;
			}
			else {
				throw new Error(this.constructor.name + ' debug must be a boolean.');
			}
		}
	}
	get debug() {
		return this._debug;
	}
	async connect() {
		this.client = await new MongoClient(this.connectionUrl, this.connectionOptions, this.errorCallback).connect();
		if (this.debug) {
			console.log('Connected to ' + this.connectionUrl);
		}
		return this.client;
	}
	errorCallback(error) {
		if (error) {
			console.error(error);
		}
	}
	getDatabase(databaseName) {
		if (databaseName === undefined) {
			databaseName = this.databaseName;
		}
		if (this.client) {
			this.database = this.client.db(databaseName);
			if (this.database) {
				return this.database;
			}
		}
	}
	close() {
		this.client.close();
		this.client = null;
		this.database = null;
		if (this.debug) {
			console.log('Closed connection to ' + this.connectionUrl);
		}
	}
}

module.exports = DatabaseConnection;
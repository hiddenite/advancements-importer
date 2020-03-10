import fs from 'fs';
import moment from 'moment';
import path from 'path';
import util from 'util';
import _ from 'lodash';

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

const STATEMENT = 'INSERT INTO atf_statistics (season, player_id, stat_category, stat_key, stat_value) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE stat_value = ?';

export default class Statistics {
	constructor(season, connection) {
		this.season = season;
		this.connection = connection;
	}

	async init() {
		this.preparedStatement = await this.connection.prepare(STATEMENT);
	}

	async close() {
		await this.preparedStatement.close();
	}

	async importFolder(folder) {
		const files = await readdir(folder);
		for (const file of files) {
			await this.importFile(path.join(folder, file));
		}
	}

	async importFile(filename) {
		const playerId = path.basename(filename, '.json');
		const fileContent = await readFile(filename, 'utf8');
		const statistics = JSON.parse(fileContent);
		await this.importPlayer(playerId, statistics.stats);
	}

	async importPlayer(playerId, statistics) {
		const statsCategories = Object.keys(statistics);
		for (const statCategory of statsCategories) {
			const category = statistics[statCategory];
			const statsKeys = Object.keys(category);
			for (const statKey of statsKeys) {
				const statValue = category[statKey];
				console.log(playerId, statCategory, statKey, statValue);
				await this.preparedStatement.execute([this.season, playerId, statCategory, statKey, statValue, statValue]);
			}
		}
	}
}

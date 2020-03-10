import fs from 'fs';
import moment from 'moment';
import path from 'path';
import util from 'util';
import _ from 'lodash';

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

const STATEMENT = 'INSERT IGNORE INTO atf_achievements (player_id, achievement_id, unlock_date, season) VALUES (?, ?, ?, ?)';

export default class Achievements {
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
		const advancements = JSON.parse(fileContent);
		await this.importPlayer(playerId, advancements);
	}

	async importPlayer(playerId, advancements) {
		const advancementKeys = Object.keys(advancements);
		for (const advancementKey of advancementKeys) {
			if (advancementKey === 'DataVersion' || advancementKey.startsWith('minecraft:recipes')) {
				continue;
			}

			const advancement = advancements[advancementKey];
			if (!advancement.done) {
				continue;
			}

			const unlockDate = this.getUnlockDateFromAdvancement(advancement);
			if (!unlockDate) {
				console.error(`warning: No unlock date (advancement ${advancement}, player ${playerId})`);
				continue;
			}

			console.log(playerId, advancementKey, unlockDate);
			await this.preparedStatement.execute([playerId, advancementKey, unlockDate, this.season]);
		}
	}

	getUnlockDateFromAdvancement(advancement) {
		const unlockDates = Object.values(advancement.criteria)
			.map(x => moment(x, 'YYYY-MM-DD HH:mm:ss ZZ', true))
			.filter(x => x.isValid())
			.map(x => x.toDate());
		return _.max(unlockDates);
	}
}

import fs from 'fs';
import moment from 'moment';
import mysql from 'mysql2/promise';
import path from 'path';
import util from 'util';
import _ from 'lodash';

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

const STATEMENT = 'INSERT IGNORE INTO atf_achievements (player_id, achievement_id, unlock_date, season) VALUES (?, ?, ?, ?)';
const SEASON = 2;

let connection = null;
let preparedStatement = null;

async function main() {
	connection = await mysql.createConnection({
		host: process.env.MYSQL_HOST,
		user: process.env.MYSQL_USER,
		password: process.env.MYSQL_PASSWORD,
		database: process.env.MYSQL_DATABASE
	});

	preparedStatement = await connection.prepare(STATEMENT);

	await importFolder('./world/advancements/')
	await connection.end();
}

async function importFolder(folder) {
	const files = await readdir(folder);
	for (const file of files) {
		await importFile(path.join(folder, file));
	}
}

async function importFile(filename) {
	const playerId = path.basename(filename, '.json');
	const fileContent = await readFile(filename, 'utf8');
	const advancements = JSON.parse(fileContent);
	await importPlayer(playerId, advancements);
}

async function importPlayer(playerId, advancements) {
	const advancementKeys = Object.keys(advancements);
	for (const advancementKey of advancementKeys) {
		if (advancementKey === 'DataVersion' || advancementKey.startsWith('minecraft:recipes')) {
			continue;
		}

		const advancement = advancements[advancementKey];
		if (!advancement.done) {
			continue;
		}

		const unlockDate = getUnlockDateFromAdvancement(advancement);
		if (!unlockDate) {
			console.error(`warning: No unlock date (advancement ${advancement}, player ${playerId})`);
			continue;
		}

		console.log(playerId, advancementKey, unlockDate);
		await preparedStatement.execute([playerId, advancementKey, unlockDate, SEASON]);
	}
}

function getUnlockDateFromAdvancement(advancement) {
	const unlockDates = Object.values(advancement.criteria)
		.map(x => moment(x, 'YYYY-MM-DD HH:mm:ss ZZ', true))
		.filter(x => x.isValid())
		.map(x => x.toDate());
	return _.max(unlockDates);
}

main().catch(console.error);

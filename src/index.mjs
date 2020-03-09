import fs from 'fs';
import moment from 'moment';
import mysql from 'mysql';
import path from 'path';
import util from 'util';
import _ from 'lodash';

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

async function main() {
	await importFolder('./advancements/')
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

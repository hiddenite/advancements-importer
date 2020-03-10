import Achievements from './achievements.mjs';
import mysql from 'mysql2/promise';
import Statistics from './statistics.mjs';

const SEASON = 1;

async function main() {
	const connection = await mysql.createConnection({
		host: process.env.MYSQL_HOST,
		user: process.env.MYSQL_USER,
		password: process.env.MYSQL_PASSWORD,
		database: process.env.MYSQL_DATABASE
	});

	const achievements = new Achievements(SEASON, connection);
	await achievements.init();
	await achievements.importFolder('./world/advancements/');
	await achievements.close();

	const statistics = new Statistics(SEASON, connection);
	await statistics.init();
	await statistics.importFolder('./world/stats/');
	await statistics.close();

	await connection.end();
}

main().catch(console.error);

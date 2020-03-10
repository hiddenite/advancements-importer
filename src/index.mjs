import Achievements from './achievements.mjs';
import mysql from 'mysql2/promise';

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

	await connection.end();
}

main().catch(console.error);

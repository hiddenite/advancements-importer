import fs from 'fs';
import util from 'util';

const readFile = util.promisify(fs.readFile);
const stat = util.promisify(fs.stat);
const writeFile = util.promisify(fs.writeFile);

if (!fs.existsSync('./cache/')) {
	fs.mkdirSync('./cache/');
}

export default class Cache {
	constructor(type) {
		this.filename = `./cache/${type}.json`;
		this.lastModifications = {};
	}

	async	load() {
		try {
			this.lastModifications = JSON.parse(await readFile(this.filename));
			console.log(`Loaded ${Object.keys(this.lastModifications).length} keys from ${this.filename}.`);
		} catch (e) {
			console.log(`Cannot read ${this.filename}, using an empty cache.`);
		}
	}

	async save() {
		await writeFile(this.filename, JSON.stringify(this.lastModifications, null, 2));
		console.log(`Saved ${Object.keys(this.lastModifications).length} keys to ${this.filename}.`);
	}

	async update(filename) {
		const lastModification = Math.floor((await stat(filename)).mtimeMs);
		if (this.lastModifications[filename] === lastModification) {
			return false;
		}
		this.lastModifications[filename] = lastModification;
		return true;
	}
}

const Database = require('better-sqlite3')
const db = new Database('database/main_memory.db') // , {verbose: console.log });
const moment = require('moment')
db.prepare(
	`CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER NOT NULL UNIQUE,
    fromu TEXT,
    stage TEXT,
    settings TEXT
    );`,
).run()

// const stmt3 = db.prepare(`DROP TABLE users`).run()
db.prepare(
	`CREATE TABLE IF NOT EXISTS posts (
    user_id INT,
    info INT,
    time INT,
    message_id TEXT
    );`,
).run()

db.prepare(
	`CREATE TABLE IF NOT EXISTS queue (
    user_id INTEGER NOT NULL,
    link TEXT NOT NULL,
    time INT NOT NULL
    );`,
).run()
async function deleteQ() {
	const stmt3 = await db
		.prepare(
			'DROP TABLE queue',
		)
		.run()
	await db
		.prepare(
			`CREATE TABLE IF NOT EXISTS queue (
    user_id INTEGER NOT NULL,
    link TEXT NOT NULL,
    time INT NOT NULL
    );`,
		).run()
}

async function addToQueue(uid, link, time) {
	await db
		.prepare(
			`INSERT INTO queue
(user_id, link, time) VALUES (?, ?, ?);`,
		)
		.run(uid, link, time)
	console.log(
		'link: ' +
      link +
      ' - added to queue  ' +
      moment.unix(time).format('D H:m:s') +
      ' (' +
      time +
      ')',
	)
}
async function getNextQueue() {
	const getQueue = await db
		.prepare('SELECT * FROM queue ORDER BY time DESC')
		.all()
	return getQueue
}

async function deleteFromQueue(uid, link) {
	if (link == undefined) {
		await db
			.prepare(
				`DELETE FROM queue
        WHERE user_id = ?`,
			)
			.run(uid, link)
		console.log(uid + '\'s links - dropped from queue  ')
	} else {
		await db
			.prepare(
				`DELETE FROM queue
        WHERE user_id = ? AND
        link = ?`,
			)
			.run(uid, link)
		console.log('link: ' + link + ' - dropped from queue  ')
	}
}

// getPost(308552322)
async function addUser(from) {
	const uid = from.id
	const fromString = JSON.stringify(from)
	await db
		.prepare(
			`INSERT OR IGNORE INTO users
      (user_id, fromu, stage) VALUES (?, ?, ?);`,
		)
		.run(uid, fromString, 0)
}
async function updateStage(uid, stage) {
	await db
		.prepare(
			`UPDATE users SET
      stage = ${stage}
      WHERE user_id=?`,
		)
		.run(uid)
}
async function listUsers() {
	const count = await db.prepare('SELECT COUNT(user_id) FROM users').get()
	const list = await db.prepare('SELECT * FROM users').all()
	let usersstring = count['COUNT(user_id)'] + ' users:'
	list.map((user) => {
		const fromU = JSON.parse(user.fromu)
		usersstring +=
      '\n[' +
      fromU.first_name +
      '](https://t.me/' +
      fromU.username +
      ')  ' +
      '`' +
      fromU.id +
      '`'
	})
	const returnObj = {}
	returnObj.string = usersstring
	returnObj.list = list
	console.log(usersstring)
	return returnObj
}
listUsers()
async function getStage(uid) {
	const getStage = await db
		.prepare(`SELECT stage FROM users WHERE user_id=${uid}`)
		.get()
	// console.log(getStage);
	if (getStage) {
		// console.log(getStage.stage);
		// console.log();
		return getStage.stage
	} else return
}

async function updateSettings(uid, settingName, setting) {
	if (settingName) {
		const settings = await getSettings(uid)
		// console.log('old settings')
		//   console.log(settings)
		switch (settingName) {
		case 'showtag':
			if (settings.showtag == 1) {
				settings.showtag = 0
			} else {
				settings.showtag = 1
			}
			break
		case 'tagtranslate':
			if (settings.tagtranslate == 1) {
				settings.tagtranslate = 0
			} else {
				settings.tagtranslate = 1
			}
			break
		}
		const updatedSettings = JSON.stringify(settings)
		await db
			.prepare('UPDATE users SET settings = ? WHERE user_id=?')
			.run(updatedSettings, uid)
	} else {
		const settings = '{"showtag": 1, "tagtranslate": 1}'
		await db
			.prepare('UPDATE users SET settings = ? WHERE user_id=?')
			.run(settings, uid)
	}
}
async function getSettings(uid) {
	const getsettings = await db
		.prepare(`SELECT settings FROM users WHERE user_id=${uid}`)
		.get()
	// console.log("getsettings");
	// console.log(getsettings);
	if (getsettings && getsettings.settings) {
		// console.log(JSON.parse(getsettings.settings));
		return JSON.parse(getsettings.settings)
	} else return
}
module.exports = {
	addUser,
	getStage,
	updateStage,
	listUsers,
	deleteFromQueue,
	getNextQueue,
	addToQueue,
	updateSettings,
	getSettings,
	deleteQ,
}

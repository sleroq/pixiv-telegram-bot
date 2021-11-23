import { User } from 'grammy'

import Database from 'better-sqlite3'
import Werror from '../lib/errors'
const db = new Database('database/memory.db', { verbose: console.log })

db.prepare(
	`CREATE TABLE IF NOT EXISTS users (
    id            INTEGER NOT NULL UNIQUE,
    first_name    TEXT    NOT NULL,
    username      TEXT,
    language_code TEXT,
    );`
).run()

export interface UserRecord {
  id:            number,
  first_name:    string,
  username?:     string,
  language_code: string,
}

export function getUser(user: User) {
	try {
		await db.exec(
			`INSERT OR IGNORE INTO users
      (id, first_name, username, language_code)
      VALUES (
        ${user.id},
        ${user.first_name},
        ${user.username || null},
        ${user.language_code || 'en'}
        );`
		)
	} catch (error) {
		throw new Werror(error, 'Saving user')
	}
}
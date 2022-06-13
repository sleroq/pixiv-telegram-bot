import { Bot, Context } from 'grammy'
import { FluentContextFlavor, useFluent } from '@grammyjs/fluent'
import { parseMode } from '@grammyjs/parse-mode'
import { Logger } from 'pino'
import Werror from '../lib/errors.js'
import handlers from './handlers/index.js'

import fluent from '../lib/translations.js'
export type MyContext = Context & FluentContextFlavor

export default function initBot(token: string, logger: Logger) {
	const bot = new Bot<MyContext>(token)
	bot.use(useFluent({ fluent }))

	bot.api.config.use(parseMode('HTML'))

	bot.catch(({ ctx, error }) => {
		logger.error(error)
		if (error instanceof Error) {
			const { message } = error

			if (!message.includes(token)) {
				return ctx.reply(ctx.t('errors.error', { message }))
			} else {
				return ctx.reply(ctx.t('errors.unknown'))
			}
		} else {
			throw new Werror(error, 'Error is not an instance of Error')
		}
	})

	bot.use(handlers)

	return bot
}

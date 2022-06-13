import { pino } from 'pino'
const logger = pino(
	{
		level: 'info',
	},
	pino.destination({
		dest: './logs/pixiv-bot.log',
	}),
)

export default logger

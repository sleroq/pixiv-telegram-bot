import logger from '../../lib/logger.js'
import Composer from '../composer.js'
const composer = new Composer()

composer.on('message:entities:url', async (ctx) => {
	const message = ctx.message.text

	const urls: string[] = []
	ctx.message.entities.forEach((e) => {
		if (e.type === 'url') {
			const url = message.slice(e.offset, e.offset + e.length)
			if (url.match(/pixiv.net\/.+\/artworks\/[0-9]+/gm)) {
				urls.push(url)
			}
		}
	})

	logger.info(`got ${urls.length} urls`)

	for (const url of urls) {
		await ctx.reply(url)
	}
})

export default composer

import logger from '../../lib/logger.js'
import Werror from '../../lib/errors.js'
import Composer from '../composer.js'
import pixiv, { IllustDetails, IllustPage } from '../../lib/pixiv-api.js'
import { GrammyError, InputFile } from 'grammy'
import { MyContext } from '../index.js'
import { setTimeout } from 'timers/promises'
import got from 'got'

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
		const matchId = url.match(/artworks\/([0-9]+)/)
		if (!matchId || !matchId[1]) continue
		const id = matchId[1]

		const illustDetails = await pixiv.getIllustDetails(id)

		if (illustDetails.pageCount > 1) {
			await replyMediaGroup(illustDetails, ctx)
		} else {
			const photoCaption = assemblePhotoCaption(illustDetails)
			const documentCaption = assembleDocumentCaption(illustDetails)
			await replyOnePhoto(
				photoCaption,
				documentCaption,
				illustDetails.urls.regular,
				illustDetails.urls.original,
				ctx,
			)
		}
	}

	logger.info('finished!')
})

async function replyOnePhoto(
	photoCaption: string,
	documentCaption: string,
	regular: string,
	original: string,
	ctx: MyContext,
) {
	try {
		await ctx.replyWithPhoto(regular, {
			caption: photoCaption,
		})
	} catch (error) {
		throw new Werror(error, 'replying with photo')
	}

	const fileName = getFileName(original)

	try {
		await ctx.replyWithDocument(original, {
			caption: documentCaption,
		})
	} catch (error) {
		// Fallback to downloading manually, helps if file is too big
		if (
			error instanceof GrammyError &&
			error.error_code === 400 &&
			error.message.includes(
				'Bad Request: wrong file identifier/HTTP URL specified',
			)
		) {
			logger.info('downloading manually')
			let downloadedPage: Buffer
			try {
				downloadedPage = await downloadImage(original)
			} catch (e) {
				throw new Werror(e, 'Downloading image manually')
			}

			try {
				await ctx.replyWithDocument(new InputFile(downloadedPage, fileName), {
					caption: documentCaption,
				})
			} catch (e) {
				throw new Werror(e, 'replying with downloaded document')
			}
		} else {
			throw new Werror(error, 'replying with document')
		}
	}
}

async function replyMediaGroup(illust: IllustDetails, ctx: MyContext) {
	const photoCaption = assemblePhotoCaption(illust)

	const pages = await pixiv.getIllustPages(illust.id)

	const totalGroups = Math.ceil(pages.length / 10)
	for (let i = 0; i < totalGroups; i++) {
		const group = pages.slice(i * 10, i * 10 + 10)

		if (group.length === 1) {
			const documentCaption = assembleDocumentCaption(illust)
			try {
				await replyOnePhoto(
					photoCaption,
					documentCaption,
					illust.urls.regular,
					illust.urls.original,
					ctx,
				)
			} catch (error) {
				throw new Werror(error, 'Replying with last photo')
			}
			continue
		}

		try {
			await replyWithGroupPhoto(group, photoCaption, 'regular', ctx)
		} catch (error) {
			// Fallback to small pictires, sometimes it helps
			if (error instanceof GrammyError && error.error_code === 400) {
				logger.warn(
					'could not send media group with regular images, trying with small',
				)
				try {
					await replyWithGroupPhoto(group, photoCaption, 'small', ctx)
				} catch (e) {
					throw new Werror(e, 'replying with media group of small pictures')
				}
			} else {
				throw new Werror(error, 'replying with Group of photos')
			}
		}

		try {
			await replyWithGroupDocument(group, ctx)
		} catch (error) {
			// Fallback to downloading manually, helps if file is too big
			if (
				error instanceof GrammyError &&
				error.error_code === 400 &&
				error.message.includes(
					'Bad Request: wrong file identifier/HTTP URL specified',
				)
			) {
				logger.info('downloading manually')
				try {
					await replyWithDownloadedDocuments(group, ctx)
				} catch (e) {
					throw new Werror(
						e,
						'Can not reply with downloaded manually documents',
					)
				}
			} else {
				throw new Werror(error, 'Replying with documents')
			}
		}

		// If telegram already cached pictures, but can reply a bit too fast
		await setTimeout(500)
	}
}

interface InputMedia {
	type: 'photo' | 'document'
	media: string | InputFile
	caption?: string
	parse_mode?: 'HTML'
}

async function replyWithGroupPhoto(
	pages: IllustPage[],
	caption: string,
	size: 'regular' | 'small',
	ctx: MyContext,
) {
	const mediaGroupPhoto: InputMedia[] = pages.map((page, index) => {
		return {
			type: 'photo',
			media: page.urls[size],
			caption: index === 0 ? caption : undefined,
			parse_mode: 'HTML',
		}
	})

	await ctx.replyWithMediaGroup(mediaGroupPhoto)
}

async function replyWithGroupDocument(pages: IllustPage[], ctx: MyContext) {
	const mediaGroupDocument: InputMedia[] = pages.map((page) => {
		return {
			type: 'document',
			media: page.urls.original,
			caption: `<code>${page.width}x${page.height}</code>`,
			parse_mode: 'HTML',
		}
	})
	await ctx.replyWithMediaGroup(mediaGroupDocument)
}

async function replyWithDownloadedDocuments(
	pages: IllustPage[],
	ctx: MyContext,
) {
	for (const page of pages) {
		let downloadedPage: Buffer
		try {
			downloadedPage = await downloadImage(page.urls.original)
		} catch (e) {
			throw new Werror(e, 'Downloading image manually')
		}
		const fileName = getFileName(page.urls.original)
		await ctx.replyWithDocument(new InputFile(downloadedPage, fileName))
	}
}

async function downloadImage(url: string): Promise<Buffer> {
	return (
		await got(url, {
			responseType: 'buffer',
			headers: {
				Referer: 'https://www.pixiv.net/',
			},
		})
	).body
}

function assemblePhotoCaption(i: IllustDetails): string {
	const title = i.title
		.replace('&', '&apm;')
		.replace('<', '&lt;')
		.replace('>', '&gt;')

	const userName = i.userName
		.replace('&', '&apm;')
		.replace('<', '&lt;')
		.replace('>', '&gt;')

	return `
<a href="https://pixiv.net/en/artworks/${i.id}">${title}</a>

by <a href="https://www.pixiv.net/en/users/${i.userId}">${userName}</a>`
}

function assembleDocumentCaption(i: IllustDetails): string {
	return `<code>${i.width}x${i.height}</code>`
}

function getFileName(url: string): string {
	const matchFileName = url.match(/[0-9]+_p[0-9]+\.(png|jpg)$/)
	if (!matchFileName || !matchFileName[0]) {
		throw new Error('Can not find image extension in url')
	}
	return matchFileName[0]
}

export default composer

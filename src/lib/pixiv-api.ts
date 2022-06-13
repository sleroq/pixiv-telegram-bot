import Werror from './errors.js'
import got from 'got'

interface PixivResponse<T> {
	error: boolean
	message: string
	body: T
}

export interface IllustDetails {
	illustId: string
	illustTitle: string
	illustComment: string
	id: string
	title: string
	description: string
	illustType: 0 | 1 | 2
	createDate: string
	uploadDate: string
	restrict: number
	xRestrict: 0 | 1 | 2
	sl: 0 | 2 | 4 | 6
	urls: Urls
	tags: {
		authorId: string
		isLocked: boolean
		tags: {
			tag: string
			locked: boolean
			deletable: boolean
			userId: string
			romaji: string
			translation?: {
				en: string
			}
			userName: string
		}[]
		writable: boolean
	}
	storableTags: string[]
	userId: string
	userName: string
	userAccount: string
	userIllusts: {
		[key: string]: null | {
			id: string
			title: string
			illustType: number
			xRestrict: 0 | 1 | 2
			restrict: number
			sl: 0 | 2 | 4 | 6
			url: string
			description: string
			tags: string[]
			userId: string
			userName: string
			width: number
			height: number
			pageCount: number
			isBookmarkable: boolean
			bookmarkData: null | {
				id: string
				private: boolean
			}
		}
	}
	likeData: boolean
	width: number
	height: number
	pageCount: number
	bookmarkCount: number
	likeCount: number
	commentCount: number
	responseCount: number
	viewCount: number
	isHowto: boolean
	isOriginal: boolean
	imageResponseOutData: []
	imageResponseData: []
	imageResponseCount: number
	pollData: null
	seriesNavData: null | {
		seriesType: string
		seriesId: string
		title: string
		order: number
		next: {
			title: string
			order: number
			id: string
		} | null
		prev: {
			title: string
			order: number
			id: string
		} | null
	}
	descriptionBoothId: null
	descriptionYoutubeId: null
	comicPromotion: null
	contestBanners: []
	isBookmarkable: boolean
	bookmarkData: null | {
		id: string
		private: boolean
	}
	contestData: null
	zoneConfig: {
		responsive: {
			url: string
		}
		'300x250': {
			url: string
		}
		'500x500': {
			url: string
		}
		header: {
			url: string
		}
		footer: {
			url: string
		}
		expandedFooter: {
			url: string
		}
		logo: {
			url: string
		}
	}
	extraData: ExtraData
}

interface ExtraData {
	meta: {
		title: string
		description: string
		canonical: string
		alternateLanguages: {
			ja: string
			en: string
		}
		descriptionHeader: string
		ogp: {
			description: string
			image: string
			title: string
			type: string
		}
		twitter: {
			description: string
			image: string
			title: string
			card: string
		}
	}
}

export interface IllustPage {
	urls: Urls
	width: number
	height: number
}

interface Urls {
	mini: string
	thumb: string
	small: string
	regular: string
	original: string
}

export default class PixivAPI {
	static async getIllustDetails(id: string): Promise<IllustDetails> {
		let response
		try {
			response = await got(`https://www.pixiv.net/ajax/illust/${id}`).json<
				PixivResponse<IllustDetails>
			>()
		} catch (error) {
			throw new Werror(error, 'get request for illustration details')
		}

		if (response.error || !response.body) {
			throw new Werror(`error in pixiv response: ${response.message}`)
		}

		return response.body
	}
	static async getIllustPages(id: string): Promise<IllustPage[]> {
		let response
		try {
			response = await got(
				`https://www.pixiv.net/ajax/illust/${id}/pages`,
			).json<PixivResponse<IllustPage[]>>()
		} catch (error) {
			throw new Werror(error, 'get request for illustration pages')
		}

		if (response.error || !response.body) {
			throw new Werror(`error in pixiv response: ${response.message}`)
		}

		return response.body
	}
}

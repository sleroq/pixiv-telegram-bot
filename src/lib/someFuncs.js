function getshowTagsText(settings) {
	if (settings.showtag == 1) {
		return 'show tags ✅'
	} else {
		return 'show tags ❌'
	}
}

function getTranslateTagsText(settings) {
	if (settings.tagtranslate == 1) {
		return 'translate tags ✅'
	} else {
		return 'translate tags ❌'
	}
}
module.exports = {
	getshowTagsText,
	getTranslateTagsText,
}

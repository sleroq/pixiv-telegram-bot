const memory = require('../database/data_work.js')
const fetch = require('node-fetch')
const moment = require('moment')

const pixivImg = require('pixiv-img')
const fs = require('fs')
const translate = require('translate')

const { promisify } = require('util')
const sizeOf = promisify(require('image-size'))

const PixivAppApi = require('pixiv-app-api')
const pixiv = new PixivAppApi('user_hczv3542', '9232917131bot', {
  camelcaseKeys: true,
})
async function route(tagname) {
  const translated = await translate(tagname, {
    from: 'ja',
    to: 'en',
    engine: 'yandex',
    key: 'trnsl.1.1.20200205T150624Z.0d3bdf6192dc75b0.bde2a5534a3961ab43ed5d789cc8afa76a31a39f',
  })
  return translated.toLowerCase()
}
async function reply(ctx) {
  await memory.addUser(ctx.from)
  let settings = await memory.getSettings(ctx.from.id)
  if (!settings) {
    await memory.updateSettings(ctx.from.id)
    settings = await memory.getSettings(ctx.from.id)
  }
  console.log('entered illustByLink')
  await pixiv.login()
  async function processingQueue(queue) {
    const time = moment()
    console.log('start processing Queue:  ' + moment().format('LTS'))
    for (let i = 0; i < queue.length; i++) {
      const url = queue[i]
      const illustId = url.link.split('/artworks/')[1]
      const uid = url.user_id
      const illustDetails = await pixiv
        .illustDetail(illustId)
        .catch(async (err) => {
          await ctx.telegram.sendMessage(uid, 'something wrong with link')
          await memory.deleteFromQueue(uid, url.link)
          throw new Error('uid')
          return
        })
      if (
        illustDetails &&
        illustDetails.illust &&
        illustDetails.illust.id == 79441893
      ) {
        await memory.deleteFromQueue(uid, url.link)
        return
      }
      if (illustDetails == undefined || illustDetails.illust == undefined) {
        await ctx.reply('something wrong with link')
        await memory.deleteFromQueue(uid, url.link)
        throw new Error('illustDetails == undefined')
        return
      }
      await replyIllust(ctx, illustDetails.illust, url.link, uid).catch(
        (err) => {
          console.log('err - cant reply', err)
        }
      )
      await memory.deleteFromQueue(uid, url.link)
    }
    const time2 = moment()
    console.log('finish processing Queue:  ' + moment().format('LTS'))
    console.log('it took ' + time2.diff(time, 'seconds') + ' seconds')
    startProcessing()
  }
  const processingCount = 0
  async function startProcessing() {
    const queue = await memory.getNextQueue()

    if (queue != null && queue != undefined && queue[0] != undefined) {
      await processingQueue(queue)
        .catch(async (err) => {
          await processingQueue(await memory.getNextQueue()).catch(
            async (err) => {
              await processingQueue(await memory.getNextQueue())
            }
          )
        })
        .catch(async (err) => {
          memory.deleteQ()
          console.log('cant process')
          // await ctx.reply(
          //   "cant"
          // );
        })
    }
  }
  await startProcessing()
  async function replyIllust(ctx, illustDetails, url, uid) {
    // console.log(illustDetails)
    const artistLink = 'https://www.pixiv.net/en/users/' + illustDetails.user.id
    const settings = await memory.getSettings(ctx.from.id)
    const tags = illustDetails.tags
    // console.log(tags);
    async function get_photo_caption() {
      let string = `
[${illustDetails.title}](${url})\n\n`
      if (settings.showtag == 1) {
        if (settings.tagtranslate == 1) {
          for (let i = 0; i < tags.length; i++) {
            const gettagname = async () => {
              if (tags[i].translatedName) {
                return tags[i].translatedName.replace(/\s/g, '_')
              } else {
                // console.log(tags[i].name)
                const translatedTag = await route(tags[i].name)
                // console.log(translatedTag)
                return translatedTag.replace(/\s/g, '\\_')
              }
            }
            const tagname = await gettagname()
            if (i == tags.length - 1) {
              string +=
                '#' +
                tagname +
                `\n\n_by_  [${illustDetails.user.name}](${artistLink})`
            } else {
              string += '#' + tagname + ', '
            }
          }
          // console.log(string)
          return string
        } else {
          for (let i = 0; i < tags.length; i++) {
            if (i == tags.length - 1) {
              string +=
                '#' +
                tags[i].name.replace(/\s/g, '_') +
                `\n\n_by_  [${illustDetails.user.name}](${artistLink})`
            } else {
              string += '#' + tags[i].name + ', '
            }
          }
          return string
        }
      } else {
        return `
[${illustDetails.title}](${url})\n
_by_  [${illustDetails.user.name}](${artistLink})
`
      }
    }
    const photo_caption = await get_photo_caption()
    if (illustDetails.pageCount == 1) {
      // console.log(illustDetails)
      const original = illustDetails.metaSinglePage.originalImageUrl
      const filename = 'full' + original.substr(original.lastIndexOf('.'))
      const file = await pixivImg(original)
      const photo = await pixivImg(illustDetails.imageUrls.large)
      const file_caption =
        '`' + illustDetails.width + '×' + illustDetails.height + '`'
      await ctx.telegram.sendChatAction(uid, 'upload_photo')
      await ctx.telegram
        .sendPhoto(
          uid,
          {
            source: fs.readFileSync(file),
          },
          {
            caption: photo_caption,
            parse_mode: 'markdown',
          }
        )
        .catch(async (err) => {
          console.log('reply with file failed :(')
          await ctx.telegram
            .sendPhoto(
              uid,
              {
                source: fs.readFileSync(photo),
              },
              {
                caption: photo_caption,
                parse_mode: 'markdown',
              }
            )
            .catch((err) => {
              console.log('reply with photo failed :(', err)
            })
        })
      await fs.unlink(photo, () => {
        // console.log("photo deleted");
      })
      await ctx.telegram.sendChatAction(uid, 'upload_document')
      await ctx.telegram
        .sendDocument(
          uid,
          {
            source: fs.readFileSync(file),
            filename: filename,
          },
          {
            caption: file_caption,
            parse_mode: 'markdown',
          }
        )
        .catch((err) => {
          console.log('reply with file failed :(', err)
        })
      await fs.unlink(file, () => {
        // console.log("file deleted");
      })
      return
    } else if (illustDetails.metaPages[1]) {
      const metaPages = illustDetails.metaPages
      let mediaGroup = []
      let mediaGroupOriginal = []
      let photos = []
      let files = []
      let filesToDel = []
      for (let i = 0; i < metaPages.length; i++) {
        await ctx.telegram.sendChatAction(uid, 'upload_photo')
        const orig_image = await pixivImg(
          illustDetails.metaPages[i].imageUrls.original
        )
        const large_image = await pixivImg(
          illustDetails.metaPages[i].imageUrls.large
        )

        photos.push(large_image)
        filesToDel.push(orig_image)
        const filename = 'full' + orig_image.substr(orig_image.lastIndexOf('.'))
        await sizeOf(orig_image)
          .then((dimensions) => {
            const caption =
              '`' + dimensions.width + '×' + dimensions.height + '`'
            files.push({
              source: orig_image,
              caption: caption,
              filename: filename,
            })
          })
          .catch((err) => console.error(err))
        if (i % 10 == 0) {
          mediaGroupOriginal.push({
            media: {
              source: fs.readFileSync(orig_image),
            },
            caption: photo_caption,
            parse_mode: 'markdown',
            type: 'photo',
          })
          mediaGroup.push({
            media: {
              source: fs.readFileSync(large_image),
            },
            caption: photo_caption,
            parse_mode: 'markdown',
            type: 'photo',
          })
        } else {
          mediaGroupOriginal.push({
            media: {
              source: fs.readFileSync(orig_image),
            },
            type: 'photo',
          })
          mediaGroup.push({
            media: {
              source: fs.readFileSync(large_image),
            },
            type: 'photo',
          })
        }
        if ((i % 9 == 0 && i != 0) || i == metaPages.length - 1) {
          await ctx.telegram.sendChatAction(uid, 'upload_photo')
          // console.log(mediaGroup.length);
          await ctx.telegram
            .sendMediaGroup(uid, mediaGroupOriginal)
            .catch(async (err) => {
              await ctx.telegram
                .sendMediaGroup(uid, mediaGroup)
                .catch(async (err) => {
                  console.error('cant send mediaGroup')
                  await ctx.telegram.sendMessage(uid, 'cant send mediaGroup')
                })
            })
          for (let k = 0; k < files.length; k++) {
            await ctx.telegram.sendChatAction(uid, 'upload_document')
            await ctx.telegram.sendDocument(
              uid,
              {
                source: fs.readFileSync(files[k].source),
                filename: files[k].filename,
              },
              {
                caption: files[k].caption,
                parse_mode: 'markdown',
              }
            )
            // .catch(err => console.log(err));
          }
          for (let k = 0; k < filesToDel.length; k++) {
            const filename = filesToDel[k]
            await fs.unlink(filesToDel[k], () => {
              // console.log("file " + filename + " - deleted");
            })
          }
          for (let n = 0; n < photos.length; n++) {
            const filename = photos[n]
            await fs.unlink(photos[n], () => {
              // console.log("photo " + filename + " - deleted");
            })
          }
          photos = []
          files = []
          mediaGroup = []
          mediaGroupOriginal = []
          filesToDel = []
        }
      }
    }
  }
}

module.exports = { reply }

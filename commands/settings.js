const memory = require("../database/data_work.js");
const { getTranslateTagsText, getshowTagsText } = require("../someFuncs.js");

module.exports.settings_reply = async function (ctx) {
    let settings = await memory.getSettings(ctx.from.id);
    if (!settings) {
      await memory.updateSettings(ctx.from.id);
      settings = await memory.getSettings(ctx.from.id);
    }
    ctx.reply("Settings:", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: getshowTagsText(settings),
              callback_data: "showtags"
            },
            {
              text: getTranslateTagsText(settings),
              callback_data: "translatetags"
            }
          ]
        ]
      }
    });
}
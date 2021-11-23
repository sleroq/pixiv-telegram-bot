const { to_ru } = require("./switch_to_ru.js");
const { to_en } = require("./switch_to_en.js");
const { showtags } = require("./settings_showtags.js");
const { translate } = require("./settings_translate.js");


module.exports.cb_query = async function (ctx) {
  await ctx.answerCbQuery().catch(err=>{
    console.log(err)
  });
  let query_data = ctx.update.callback_query.data;
  console.log(query_data);

  if (query_data == "ru") {
    await to_ru(ctx);
  } else if (query_data == "en") {
    await to_en(ctx);
  } else if (query_data == "showtags"){
    await showtags(ctx);
  } else if (query_data == "translatetags"){
    await translate(ctx);
  }
};

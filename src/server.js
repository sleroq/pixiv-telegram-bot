require("dotenv").config();

const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.TOKEN);

let webhook = true;
if (process.env.ON_HEROKU) {
  bot.telegram.setWebhook(process.env.HEROKU_URL);
} else if (process.env.ON_GLITCH) {
  console.log(process.env.GLITCH_URL);
  bot.telegram.setWebhook(process.env.GLITCH_URL);
} else {
  webhook = false;
}

const express = require("express");
const expressApp = express();
if (webhook) {
  expressApp.use(bot.webhookCallback("/secret-path"));
}
const getUrls = require("get-urls");
const fetch = require("node-fetch");

const pixivImg = require("pixiv-img");
const fs = require("fs");

var { promisify } = require("util");
var sizeOf = promisify(require("image-size"));

const memory = require("./database/data_work.js");

let illustByLink = require("./commands/by_link.js");

const PixivAppApi = require("pixiv-app-api");
const pixiv = new PixivAppApi(process.env.NAME, process.env.PASSWORD, {
  camelcaseKeys: true,
});
const { cb_query } = require("./buttons/index.js");

const { start_reply } = require("./commands/start.js");
const { help_reply } = require("./commands/help.js");
const { settings_reply } = require("./commands/settings.js");
const { users } = require("./commands/users.js");

bot.on("callback_query", async (ctx) => {
  await cb_query(ctx);
});

bot.start(async (ctx) => {
  await start_reply(ctx);
});
bot.help(async (ctx) => {
  await help_reply(ctx);
});

bot.command("rand", async (ctx) => {
  await ctx.reply("doesntworkyet");
});

bot.command("related", async (ctx) => {
  await ctx.reply("doesntworkyet");
});

bot.command("settings", async (ctx) => {
  await settings_reply(ctx);
});

bot.command("users", async (ctx) => {
  await users(ctx);
});
bot.command("go", async (ctx) => {
  let nextQueue = await memory.getNextQueue();
  if (nextQueue) {
    ctx.reply("goung");
    await illustByLink.reply(ctx);
  }
});
bot.on("text", async (ctx) => {
  // await illustByLink.reply(ctx)
  // ctx.reply("sorry, im working on this bot right now, try later");
  let settings = await memory.getSettings(ctx.from.id);
  if (!settings) {
    await memory.updateSettings(ctx.from.id);
    settings = await memory.getSettings(ctx.from.id);
  }
  let uid = ctx.from.id,
    message_text = ctx.message.text,
    urls = Array.from(getUrls(message_text));
  await memory.addUser(ctx.from);

  if (urls.length > 0) {
    let nextQueue = await memory.getNextQueue(),
      time = ctx.message.date,
      match;
    for (let i = 0; i < urls.length; i++) {
      if (
        (urls[i].match(/pixiv.net\//) != null &&
          urls[i].match(/\/artworks\/\d+/) != null) ||
        urls[i].match(/pixiv.net\/i\/\d+/)
      ) {
        if (urls[i].match(/pixiv.net\/i\/\d+/)) {
          let url = "https://pixiv.net/en/artworks/" + urls[i].split("/i/")[1];
          await memory.addToQueue(uid, url, time);
        } else {
          await memory.addToQueue(uid, urls[i], time);
          await ctx.telegram.sendChatAction(ctx.from.id, "upload_photo");
        }
        match = true;
      }
    }
    if (nextQueue[0] == undefined && match) {
      await illustByLink.reply(ctx);
    } else if (!match) {
      ctx.reply("something wrong with link");
    } else {
      ctx.reply("your link added to queue, please wait.");
    }
  }
});

if (webhook) {
  const PORT = process.env.PORT || 3000;
  expressApp.get("/", (req, res) => {
    res.send("Hello, love <3");
  });
  expressApp.listen(PORT, () => {
    console.log(`Our app is running on port ${PORT}`);
  });
} else {
  bot.telegram.deleteWebhook().then(() => {
    bot.launch();
  });
}

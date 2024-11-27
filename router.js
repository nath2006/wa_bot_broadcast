const { Router, Response } = require("pepesan");
const BotController = require("./controllers/BotController")
const f = require("./utils/Formatter");

const router = new Router();

router.menu(f("menu.broadcastSend"), [BotController, "sendBroadcast"]);
router.keyword("*", [BotController, "introduction"]);

module.exports = router;
import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import keysRouter from "./keys.js";
import settingsRouter from "./settings.js";
import botRouter from "./bot.js";
import tradesRouter from "./trades.js";
import strategiesRouter from "./strategies.js";
import marketRouter from "./market.js";
import portfolioRouter from "./portfolio.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(keysRouter);
router.use(settingsRouter);
router.use(botRouter);
router.use(tradesRouter);
router.use(strategiesRouter);
router.use(marketRouter);
router.use(portfolioRouter);

export default router;

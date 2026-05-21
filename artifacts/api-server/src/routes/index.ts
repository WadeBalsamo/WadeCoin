import { Router, type IRouter } from "express";
import healthRouter from "./health";
import configRouter from "./config";
import faucetRouter from "./faucet";
import bookingsRouter from "./bookings";
import exchangeRouter from "./exchange";
import logsRouter from "./logs";
import availabilityRouter from "./availability";

const router: IRouter = Router();

router.use(healthRouter);
router.use(configRouter);
router.use(faucetRouter);
router.use(bookingsRouter);
router.use(exchangeRouter);
router.use(logsRouter);
router.use(availabilityRouter);

export default router;

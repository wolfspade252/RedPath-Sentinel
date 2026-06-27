import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import scansRouter from "./scans";
import hostsRouter from "./hosts";
import identitiesRouter from "./identities";
import graphRouter from "./graph";
import attackPathsRouter from "./attackPaths";
import reportRouter from "./report";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(scansRouter);
router.use(hostsRouter);
router.use(identitiesRouter);
router.use(graphRouter);
router.use(attackPathsRouter);
router.use(reportRouter);

export default router;

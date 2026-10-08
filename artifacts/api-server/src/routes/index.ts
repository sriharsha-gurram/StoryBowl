// Collects the small API routers under the shared /api prefix.
// Keeping registration here makes the server entry point easy to read.
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storyRouter from "./story";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storyRouter);

export default router;

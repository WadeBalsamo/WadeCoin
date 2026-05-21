import { Router, type IRouter } from "express";
import { buildAppConfig } from "../services/config";

const router: IRouter = Router();

router.get("/config", (_req, res) => {
  try {
    const config = buildAppConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({
      code: "config_error",
      message: err instanceof Error ? err.message : "Failed to load configuration",
    });
  }
});

export default router;

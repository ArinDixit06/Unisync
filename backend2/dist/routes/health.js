import { Router } from "express";
import { fetchOne } from "../db.js";
import { settings } from "../config.js";
const router = Router();
const startedAt = Date.now();
router.get("/health", async (_request, response, next) => {
    try {
        response.json({ status: "ok", version: "0.1.0", uptime: Math.floor((Date.now() - startedAt) / 1000) });
    }
    catch (error) {
        next(error);
    }
});
router.get("/ready", async (_request, response, next) => {
    try {
        if (!settings.useDb) {
            response.json({ status: "ok", db: false });
            return;
        }
        const row = await fetchOne("SELECT 1");
        response.json({ status: "ok", db: Boolean(row) });
    }
    catch (error) {
        next(error);
    }
});
export default router;

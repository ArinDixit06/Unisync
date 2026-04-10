import { Router } from "express";
import { requireUser } from "../auth.js";
import { bumpUserCacheVersion } from "../services/cache.js";
import { notFound } from "../errors.js";
import { insert, remove, select, update } from "../supabaseRest.js";
const router = Router();
router.use(requireUser);
router.get("/", async (request, response, next) => {
    try {
        const rows = await select("labels", "id,name,color,created_at", {
            filters: [["user_id", "eq", request.currentUser.userId]],
            order: "name.asc",
            userToken: request.currentUser.token
        });
        response.json({ labels: rows });
    }
    catch (error) {
        next(error);
    }
});
router.post("/", async (request, response, next) => {
    try {
        await insert("labels", { user_id: request.currentUser.userId, name: request.body.name, color: request.body.color ?? "#64748b" }, { userToken: request.currentUser.token });
        await bumpUserCacheVersion(request.currentUser.userId);
        response.json({ status: "ok" });
    }
    catch (error) {
        next(error);
    }
});
router.put("/:labelId", async (request, response, next) => {
    try {
        const labelId = String(request.params.labelId);
        await update("labels", { name: request.body.name, color: request.body.color ?? "#64748b" }, {
            filters: [["id", "eq", labelId], ["user_id", "eq", request.currentUser.userId]],
            userToken: request.currentUser.token
        });
        await bumpUserCacheVersion(request.currentUser.userId);
        response.json({ status: "ok" });
    }
    catch (error) {
        next(error);
    }
});
router.delete("/:labelId", async (request, response, next) => {
    try {
        const labelId = String(request.params.labelId);
        await remove("labels", {
            filters: [["id", "eq", labelId], ["user_id", "eq", request.currentUser.userId]],
            userToken: request.currentUser.token
        });
        await bumpUserCacheVersion(request.currentUser.userId);
        response.json({ status: "ok" });
    }
    catch (error) {
        next(error);
    }
});
async function ensureEmailExists(request, emailId) {
    const emails = await select("emails", "id", {
        filters: [["id", "eq", emailId], ["user_id", "eq", request.currentUser.userId]],
        userToken: request.currentUser.token
    });
    if (!emails.length)
        notFound("Email not found");
}
router.post("/emails/:emailId/:labelId", async (request, response, next) => {
    try {
        const emailId = String(request.params.emailId);
        const labelId = String(request.params.labelId);
        await ensureEmailExists(request, emailId);
        await insert("email_labels", { email_id: emailId, label_id: labelId }, { userToken: request.currentUser.token });
        await bumpUserCacheVersion(request.currentUser.userId);
        response.json({ status: "ok" });
    }
    catch (error) {
        next(error);
    }
});
router.delete("/emails/:emailId/:labelId", async (request, response, next) => {
    try {
        const emailId = String(request.params.emailId);
        const labelId = String(request.params.labelId);
        await ensureEmailExists(request, emailId);
        await remove("email_labels", {
            filters: [["email_id", "eq", emailId], ["label_id", "eq", labelId]],
            userToken: request.currentUser.token
        });
        await bumpUserCacheVersion(request.currentUser.userId);
        response.json({ status: "ok" });
    }
    catch (error) {
        next(error);
    }
});
export default router;

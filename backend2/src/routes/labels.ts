import { Router } from "express";

import { AuthenticatedRequest, requireUser } from "../auth.js";
import { bumpUserCacheVersion } from "../services/cache.js";
import { notFound } from "../errors.js";
import { insert, remove, select, update } from "../supabaseRest.js";

const router = Router();

router.use(requireUser);

router.get("/", async (request: AuthenticatedRequest, response, next) => {
  try {
    const rows = await select("labels", "id,name,color,created_at", {
      filters: [["user_id", "eq", request.currentUser!.userId]],
      order: "name.asc",
      userToken: request.currentUser!.token
    });
    response.json({ labels: rows });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (request: AuthenticatedRequest, response, next) => {
  try {
    await insert(
      "labels",
      { user_id: request.currentUser!.userId, name: request.body.name, color: request.body.color ?? "#64748b" },
      { userToken: request.currentUser!.token }
    );
    await bumpUserCacheVersion(request.currentUser!.userId);
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

router.put("/:labelId", async (request: AuthenticatedRequest, response, next) => {
  try {
    await update(
      "labels",
      { name: request.body.name, color: request.body.color ?? "#64748b" },
      {
        filters: [["id", "eq", request.params.labelId], ["user_id", "eq", request.currentUser!.userId]],
        userToken: request.currentUser!.token
      }
    );
    await bumpUserCacheVersion(request.currentUser!.userId);
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

router.delete("/:labelId", async (request: AuthenticatedRequest, response, next) => {
  try {
    await remove("labels", {
      filters: [["id", "eq", request.params.labelId], ["user_id", "eq", request.currentUser!.userId]],
      userToken: request.currentUser!.token
    });
    await bumpUserCacheVersion(request.currentUser!.userId);
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

async function ensureEmailExists(request: AuthenticatedRequest, emailId: string): Promise<void> {
  const emails = await select("emails", "id", {
    filters: [["id", "eq", emailId], ["user_id", "eq", request.currentUser!.userId]],
    userToken: request.currentUser!.token
  });
  if (!emails.length) notFound("Email not found");
}

router.post("/emails/:emailId/:labelId", async (request: AuthenticatedRequest, response, next) => {
  try {
    await ensureEmailExists(request, request.params.emailId);
    await insert(
      "email_labels",
      { email_id: request.params.emailId, label_id: request.params.labelId },
      { userToken: request.currentUser!.token }
    );
    await bumpUserCacheVersion(request.currentUser!.userId);
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

router.delete("/emails/:emailId/:labelId", async (request: AuthenticatedRequest, response, next) => {
  try {
    await ensureEmailExists(request, request.params.emailId);
    await remove("email_labels", {
      filters: [["email_id", "eq", request.params.emailId], ["label_id", "eq", request.params.labelId]],
      userToken: request.currentUser!.token
    });
    await bumpUserCacheVersion(request.currentUser!.userId);
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

export default router;

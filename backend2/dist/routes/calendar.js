import { Router } from "express";
import { requireUser } from "../auth.js";
import { decrypt, encrypt } from "../crypto.js";
import { badRequest, notFound } from "../errors.js";
import { select, update } from "../supabaseRest.js";
import { createEvent } from "../services/calendar.js";
import { refreshToken as refreshGmailToken } from "../services/gmail.js";
const router = Router();
router.use(requireUser);
router.post("/events/:eventId/confirm", async (request, response, next) => {
    try {
        const eventId = String(request.params.eventId);
        const events = await select("suggested_events", "*", {
            filters: [["id", "eq", eventId], ["user_id", "eq", request.currentUser.userId]],
            userToken: request.currentUser.token
        });
        if (!events.length)
            notFound("Suggested event not found");
        const event = events[0];
        if (!event.start_datetime)
            badRequest("Event date missing");
        const accounts = await select("linked_accounts", "id,access_token_enc,refresh_token_enc", {
            filters: [["user_id", "eq", request.currentUser.userId], ["provider", "eq", "gmail"]],
            order: "created_at.desc",
            limit: 1,
            userToken: request.currentUser.token
        });
        if (!accounts.length)
            badRequest("No Gmail account linked for calendar sync");
        const account = accounts[0];
        let accessToken = decrypt(account.access_token_enc);
        const refreshToken = decrypt(account.refresh_token_enc || "");
        let result;
        try {
            result = await createEvent(accessToken, event.title, event.start_datetime, event.end_datetime, event.location, event.description);
        }
        catch (error) {
            if (![401, 403].includes(Number(error?.status)) || !refreshToken)
                throw error;
            const refreshed = await refreshGmailToken(refreshToken);
            accessToken = refreshed.access_token || "";
            if (!accessToken)
                badRequest("Unable to refresh Gmail token for calendar access");
            await update("linked_accounts", { access_token_enc: encrypt(accessToken) }, { filters: [["id", "eq", account.id]], userToken: request.currentUser.token });
            result = await createEvent(accessToken, event.title, event.start_datetime, event.end_datetime, event.location, event.description);
        }
        await update("suggested_events", { confirmed_at: new Date().toISOString(), gcal_event_id: result.id }, { filters: [["id", "eq", eventId]], userToken: request.currentUser.token });
        response.json({ status: "ok", event_id: result.id });
    }
    catch (error) {
        next(error);
    }
});
router.delete("/events/:eventId", async (request, response, next) => {
    try {
        const eventId = String(request.params.eventId);
        await update("suggested_events", { dismissed_at: new Date().toISOString() }, {
            filters: [["id", "eq", eventId], ["user_id", "eq", request.currentUser.userId]],
            userToken: request.currentUser.token
        });
        response.json({ status: "ok" });
    }
    catch (error) {
        next(error);
    }
});
export default router;

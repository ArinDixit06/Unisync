import { bumpUserCacheVersion } from "./services/cache.js";
import { select } from "./supabaseRest.js";
import { processEmail } from "./workers/tasks.js";

export async function enqueueJob(name: string, ...args: unknown[]): Promise<unknown> {
  if (name !== "process_email") return null;
  const result = await processEmail(args[0] as string);
  const emailId = args[0] as string | undefined;
  if (emailId) {
    const rows = await select("emails", "user_id", { filters: [["id", "eq", emailId]], useService: true });
    if (rows[0]?.user_id) await bumpUserCacheVersion(rows[0].user_id);
  }
  return result;
}

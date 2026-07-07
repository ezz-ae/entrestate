
import { adminDb } from "@/lib/firebaseAdmin";
import { ok, bad, fail, getUidFromRequest } from "@/lib/api-helpers";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { event, props } = body || {};
    if (!event || typeof event !== "string") return bad("event required");

    // Trust the verified token for identity, never a client-supplied uid.
    const uid = await getUidFromRequest(req);
    await adminDb.collection("events").add({
      event: String(event).slice(0, 120),
      uid: uid || "anon",
      props: props && typeof props === "object" ? props : {},
      ts: new Date(),
      v: 1,
    });

    return ok({ logged: true });
  } catch (e) {
    return fail(e);
  }
}

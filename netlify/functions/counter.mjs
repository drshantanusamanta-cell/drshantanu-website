// Visitor counter — Netlify Function (v2) + Netlify Blobs
// Endpoint: /api/counter
//   GET  -> returns current counts without changing them
//   POST -> adds 1 to total; adds 1 to unique when body is {"unique": true}
import { getStore } from "@netlify/blobs";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pingdom|uptime/i;

export default async (req) => {
  const store = getStore({ name: "visitor-counter", consistency: "strong" });
  let counts = (await store.get("counts", { type: "json" })) || { total: 0, unique: 0 };

  const ua = req.headers.get("user-agent") || "";
  if (req.method === "POST" && !BOT.test(ua)) {
    let body = {};
    try { body = await req.json(); } catch (e) {}
    counts = {
      total: (counts.total || 0) + 1,
      unique: (counts.unique || 0) + (body.unique === true ? 1 : 0),
    };
    await store.setJSON("counts", counts);
  }

  return Response.json(counts, { headers: { "cache-control": "no-store" } });
};

export const config = { path: "/api/counter" };

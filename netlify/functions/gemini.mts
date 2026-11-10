import type { Config, Context } from "@netlify/functions"

// Gemini proxy for the AI Health Assistant.
// The API key lives ONLY in the Netlify environment variable GEMINI_API_KEY
// (scope must include Functions). It is never sent to the browser.
// Optional: GEMINI_MODEL to pin a model (default: gemini-3.5-flash-lite).

type Turn = { role: "user" | "model"; text: string }

const DIET_RULES = `
Diet charts and dietary advice:
- When asked for a diet chart, give ONE simple 1-day Indian chart as a markdown table with 3 columns: | Time | Meal | What to eat (portion) |. Use 6–7 rows: Early morning, Breakfast, Mid-morning, Lunch, Evening snack, Dinner, and Bedtime only if useful.
- Use everyday Indian foods suited to the stated preference (vegetarian / eggetarian / non-vegetarian) and region if given (e.g. Bengali). Give portions in household measures (katori/bowl, roti, cup, glass, teaspoon, fist-size), not grams.
- After the table add at most 4 short bullet tips. Keep the whole answer under about 200 words, excluding the table.
- Keep advice consistent with the ICMR-NIN Dietary Guidelines for Indians (2024): salt not more than 5 g a day (about 1 level teaspoon); avoid added sugar or keep it within 20–25 g a day; plenty of vegetables and green leafy vegetables (about 400 g a day) plus a fruit; whole grains and millets instead of refined flour; pulses, curd/milk, nuts and seeds daily; about 5–6 teaspoons of cooking oil a day in total; avoid ultra-processed and fried foods.
- Diabetes: steady carbohydrate portions spread through the day, half plate vegetables, quarter plate whole grains, quarter plate protein (dal, paneer, egg, fish, chicken); no fruit juices or sweets. High blood pressure: DASH-style eating, low salt, avoid pickles, papad, chips and packaged foods. Heart / cholesterol: less saturated fat (ghee, butter, red meat, fried food), more fish, nuts, whole grains and fibre.
- Do not give calorie targets below 1200 kcal a day, crash or fad diets, fasting plans, or supplements.
- For kidney disease, liver disease, pregnancy, children, people on insulin, or anyone very unwell: give only general healthy-eating tips and say the plan must be made individually by Dr. Samanta or a dietitian.
- If the user mentions an eating disorder, extreme restriction, binge-purge behaviour or wanting to lose weight very fast: do not give a chart, calorie or weight numbers; respond with care and suggest talking to a doctor.
- Add this line at the very end of any reply that contains diet advice or a diet chart, and only then: TOPICS: followed by one or more of general, diabetes, hypertension, heart, weight (comma-separated). Example: TOPICS: general, diabetes
- End diet charts with: "This is a general sample chart. Your exact needs depend on your health, medicines and activity, so please review it with Dr. Samanta."`

const CHAT_PROMPT = `You are the AI wellness assistant on the website of Dr. Shantanu Samanta, a Consultant General Physician in Kolkata with special interest in Cardiology, Diabetes and Critical Care.

How to respond:
- Give clear, practical general health information, lifestyle and diet guidance, and plain-language explanations of symptoms, conditions and tests.
- Be warm, professional and concise. Use short paragraphs or bullet points. Prefer Indian context (Indian foods, Indian meal patterns) when giving diet tips.
- Reply in the language the user writes in (English, Bengali or Hindi).
- Never give a definitive diagnosis, never prescribe medicines or doses, and never advise stopping or changing a prescribed medicine.
- For anything that needs examination, tests or treatment, suggest booking a consultation at the clinic (appointments: 87775 68960 or 70444 31447).
- If the user describes possible emergency signs (chest pain, breathlessness, fainting, stroke signs such as face droop or arm weakness, severe bleeding, very high or very low blood sugar with confusion, thoughts of self-harm), tell them clearly to call 112 or go to the nearest emergency department now, before anything else.
- Remind users briefly, when relevant, that you are an AI and not a substitute for a doctor's consultation.
${DIET_RULES}`

const DIET_PROMPT = `You are the diet-chart assistant on the website of Dr. Shantanu Samanta, a Consultant General Physician in Kolkata with special interest in Cardiology, Diabetes and Critical Care. You make short, practical, general sample diet charts for patients.
- Reply in the language requested (English, Bengali or Hindi). In Bengali or Hindi, keep the table headings in that language too.
- Never prescribe medicines or doses and never advise changing prescribed medicines.
${DIET_RULES}`

// Fixed, verified references appended by the server (never written by the AI).
const REFS: Record<string, string> = {
  icmr: "[ICMR–National Institute of Nutrition. *Dietary Guidelines for Indians*, revised edition. Hyderabad: ICMR-NIN; 2024.](https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI24thJune2024fin.pdf)",
  rssdi: "[Makkar BM, et al. RSSDI Clinical Practice Recommendations for the Management of Type 2 Diabetes Mellitus 2022. *Int J Diabetes Dev Ctries*. 2022;42(Suppl 1):S1–S143.](https://doi.org/10.1007/s13410-022-01129-5)",
  ada: "[American Diabetes Association. 5. Facilitating Positive Health Behaviors and Well-being: *Standards of Care in Diabetes—2026*. *Diabetes Care*. 2026;49(Suppl 1):S89–S131.](https://doi.org/10.2337/dc26-S005)",
  dash: "[National Heart, Lung, and Blood Institute (NIH). *DASH Eating Plan: Healthy Eating, Proven Results*. 2020.](https://www.nhlbi.nih.gov/resources/dash-eating-plan-healthy-eating-proven-results)",
  aha: "[Lichtenstein AH, Appel LJ, et al. 2021 Dietary Guidance to Improve Cardiovascular Health: A Scientific Statement From the American Heart Association. *Circulation*. 2021;144:e472–e487.](https://doi.org/10.1161/CIR.0000000000001031)",
}
const TOPIC_REFS: Record<string, string[]> = {
  general: ["icmr"],
  weight: ["icmr"],
  diabetes: ["icmr", "rssdi", "ada"],
  hypertension: ["icmr", "dash"],
  heart: ["icmr", "aha"],
}

function withReferences(text: string, mode: string): string {
  const m = text.match(/^[ \t*_]*TOPICS?\s*:\s*(.+)$/im)
  let body = text.replace(/^[ \t*_]*TOPICS?\s*:.*$/gim, "").trim()
  let topics = m
    ? m[1].toLowerCase().split(/[^a-z]+/).filter((t) => t in TOPIC_REFS)
    : []
  if (!topics.length && mode === "diet") topics = ["general"]
  if (!topics.length) return body
  const keys = [...new Set(topics.flatMap((t) => TOPIC_REFS[t]))]
  const label = keys.length > 1 ? "References" : "Reference"
  return `${body}\n\n---\n**${label}** (standard guidelines this advice follows):\n${keys.map((k, i) => `${i + 1}. ${REFS[k]}`).join("\n")}`
}

const SIMPLIFY_PROMPT = `You are helping a patient of Dr. Shantanu Samanta (Consultant General Physician, Kolkata) understand a medical report they have pasted.

- Explain each test or finding in simple, everyday language.
- Where a value looks high or low against common reference ranges, say so gently and explain what that kind of result can generally mean, without diagnosing.
- Do not prescribe medicines or doses.
- End with a short "Questions to ask your doctor" list and advise reviewing the report with Dr. Samanta (appointments: 87775 68960 or 70444 31447).
- If anything looks potentially urgent (for example a critically abnormal value), say clearly that they should contact a doctor promptly.
- Begin with one line noting you are an AI and this is not a diagnosis.
- Reply in the language the user writes in.`

const MAX_TURNS = 20
const MAX_CHARS = 8000

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  })

export default async (req: Request, _context: Context) => {
  const apiKey = Netlify.env.get("GEMINI_API_KEY")
  if (!apiKey) {
    return json({ error: "The AI assistant is not configured yet. Please try again later." }, 503)
  }

  let payload: { mode?: string; messages?: Turn[] }
  try {
    payload = await req.json()
  } catch {
    return json({ error: "Invalid request." }, 400)
  }

  const mode = payload.mode === "simplify" ? "simplify" : payload.mode === "diet" ? "diet" : "chat"
  const raw = Array.isArray(payload.messages) ? payload.messages : []
  const messages = raw
    .filter((m) => m && (m.role === "user" || m.role === "model") && typeof m.text === "string" && m.text.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_CHARS) }))

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return json({ error: "Please type a message first." }, 400)
  }

  // Try models in order; when Google says a model is busy/overloaded, move to the next one.
  const preferred = Netlify.env.get("GEMINI_MODEL")
  // [model, max seconds for this attempt]. Lite models are fastest; Flash-Lite gets a second try
  // because Google's "high demand" 503s are usually brief.
  const attempts: [string, number][] = [
    ...(preferred ? [[preferred, 12] as [string, number]] : []),
    ["gemini-3.5-flash-lite", 10],
    ["gemini-3.1-flash-lite", 8],
    ["gemini-3.5-flash-lite", 8],
    ["gemini-3.6-flash", 12],
  ]

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: mode === "simplify" ? SIMPLIFY_PROMPT : mode === "diet" ? DIET_PROMPT : CHAT_PROMPT }] },
    contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    generationConfig: { temperature: mode === "chat" ? 0.6 : 0.3, maxOutputTokens: 2048 },
  })

  const deadline = Date.now() + 25000
  const RETRYABLE = new Set([404, 408, 429, 500, 502, 503, 504])
  let lastStatus = 0
  let lastDetail = ""

  for (const [model, cap] of attempts) {
    const left = Math.min(deadline - Date.now(), cap * 1000)
    if (left < 2500) break
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), left)
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body,
        signal: ctrl.signal,
      })
      clearTimeout(timer)
      const data: any = await res.json().catch(() => ({}))

      if (!res.ok) {
        lastStatus = res.status
        lastDetail = `${model}: ${res.status} ${data?.error?.status ?? ""} ${String(data?.error?.message ?? "").slice(0, 160)}`.trim()
        console.error("Gemini error", lastDetail)
        if (RETRYABLE.has(res.status)) continue
        break // e.g. 400/401/403: bad request or key problem, other models won't help
      }

      const cand = data?.candidates?.[0]
      const text = (cand?.content?.parts ?? [])
        .map((p: any) => (typeof p?.text === "string" && !p.thought ? p.text : ""))
        .join("")
        .trim()

      if (!text) {
        const blocked = data?.promptFeedback?.blockReason || cand?.finishReason === "SAFETY"
        return json({
          reply: blocked
            ? "I can't help with that particular request. For personal medical concerns, please book a consultation with Dr. Samanta (87775 68960 / 70444 31447)."
            : "Sorry, I couldn't generate a reply. Please rephrase your question.",
        })
      }
      const reply = mode === "simplify" ? text : withReferences(text, mode)
      return json({ reply, model })
    } catch (e: any) {
      clearTimeout(timer)
      lastDetail = `${model}: ${e?.name === "AbortError" ? "timed out" : String(e?.message ?? e).slice(0, 160)}`
      console.error("Gemini fetch failed", lastDetail)
      // a timeout on one model: move on to the next while time remains
    }
  }

  const msg =
    lastStatus === 429 || lastStatus === 503
      ? "The AI service is very busy right now. Please try again in a minute."
      : lastDetail.includes("timed out")
        ? "The assistant is taking too long. Please try a shorter question."
        : "The assistant could not answer right now. Please try again shortly."
  return json({ error: msg, detail: lastDetail }, 502)
}

export const config: Config = {
  path: "/api/gemini",
  method: "POST",
  rateLimit: { windowLimit: 20, windowSize: 60, aggregateBy: ["ip", "domain"] },
}

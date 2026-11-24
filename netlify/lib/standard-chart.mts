// Built-in "standard" 1-day diet chart with 4 options per meal.
// Used when Google's free-tier Gemini is busy, so patients always get a chart.
// Written to the same rules as the AI prompt (ICMR-NIN 2024; RSSDI/ADA for diabetes;
// DASH for BP; AHA 2021 for heart; KDIGO 2024 / KDOQI 2020 for kidney; ATA 2014 thyroid).
//
// Tags on each option:
//   diet:  v = vegetarian, e = needs egg (eggetarian or non-veg), n = needs non-veg
//   K = high potassium   P = protein-rich   PP = two protein foods in one meal
//   S = sweeter / higher sugar   D = dairy-heavy (phosphorus)

type Opt = { t: string; d: "v" | "e" | "n"; tags?: string }
type Region = "bengali" | "north" | "south"

const EARLY: Opt[] = [
  { t: "1 glass warm water + 4 soaked almonds", d: "v", tags: "K" },
  { t: "1 cup tea or coffee without sugar + 2 Marie biscuits", d: "v" },
  { t: "1 glass methi (fenugreek) seed water, soaked overnight", d: "v" },
  { t: "1 cup green tea + 1 tablespoon roasted chana", d: "v", tags: "K" },
  { t: "1 cup lemon water, no sugar or salt", d: "v" },
  { t: "1 cup weak tea without sugar + 1 small rusk", d: "v" },
]

const BREAKFAST: Record<Region, Opt[]> = {
  bengali: [
    { t: "2 atta rotis + 1 katori mixed vegetable tarkari (little oil)", d: "v" },
    { t: "1 bowl chire (poha) with peas and vegetables", d: "v" },
    { t: "2 atta rotis + 1 egg omelette with onion", d: "e" },
    { t: "1 bowl vegetable daliya (broken wheat) khichuri", d: "v" },
    { t: "2 slices brown bread + 1 boiled egg + cucumber", d: "e" },
    { t: "2 small besan chilla + mint chutney", d: "v", tags: "P" },
    { t: "1 bowl oats or ragi porridge with milk, no sugar", d: "v", tags: "D" },
  ],
  north: [
    { t: "2 lauki or methi parathas (little oil) + 1 small katori curd", d: "v", tags: "D" },
    { t: "1 bowl vegetable poha", d: "v" },
    { t: "2 rotis + 1 egg bhurji (little oil)", d: "e" },
    { t: "1 bowl vegetable daliya", d: "v" },
    { t: "2 besan chilla + green chutney", d: "v", tags: "P" },
    { t: "2 slices brown bread + 1 boiled egg + cucumber", d: "e" },
    { t: "1 bowl oats porridge with milk, no sugar", d: "v", tags: "D" },
  ],
  south: [
    { t: "2 idlis + ½ katori sambar + 1 tablespoon chutney", d: "v", tags: "K" },
    { t: "1 bowl vegetable upma (rava or millet)", d: "v" },
    { t: "1 plain dosa (little oil) + 1 tablespoon chutney", d: "v" },
    { t: "1 egg dosa + 1 tablespoon chutney", d: "e" },
    { t: "2 ragi dosas + 1 tablespoon chutney", d: "v" },
    { t: "1 bowl vegetable pongal (little ghee)", d: "v" },
    { t: "2 slices brown bread + 1 boiled egg", d: "e" },
  ],
}

const MID: Opt[] = [
  { t: "1 small apple", d: "v" },
  { t: "1 small guava", d: "v", tags: "K" },
  { t: "1 small pear", d: "v" },
  { t: "1 cup papaya pieces", d: "v", tags: "K" },
  { t: "1 glass buttermilk (chaas), no sugar", d: "v", tags: "D" },
  { t: "1 orange or mosambi (whole fruit, not juice)", d: "v", tags: "K" },
  { t: "8–10 grapes", d: "v", tags: "S" },
  { t: "1 small bowl sprouts chaat", d: "v", tags: "KP" },
  { t: "1 cup cucumber slices with lemon and a pinch of pepper", d: "v" },
  { t: "1 cup pineapple pieces", d: "v", tags: "S" },
  { t: "1 small bowl watermelon", d: "v", tags: "S" },
  { t: "1 small bowl roasted chire (flattened rice), no salt", d: "v" },
]

const LUNCH: Record<Region, Opt[]> = {
  bengali: [
    { t: "1 katori rice + 1 katori dal + 1 piece fish jhol (rui/katla) + 1 katori tarkari + salad", d: "n", tags: "PP" },
    { t: "1 katori rice + 1 piece fish jhol (rui/katla) + 1 katori tarkari + salad", d: "n", tags: "P" },
    { t: "2 rotis + 2 small pieces chicken curry (little oil) + 1 katori lau/potol tarkari + salad", d: "n", tags: "P" },
    { t: "1 katori rice + 1 egg curry + 1 katori dal + 1 katori tarkari + salad", d: "e", tags: "PP" },
    { t: "1 katori rice + 1 katori moong dal + 1 katori mixed vegetables (lau, potol, jhinge) + salad", d: "v" },
    { t: "2 rotis + 1 katori dal + 1 katori shak + 1 katori tarkari + salad", d: "v", tags: "K" },
    { t: "1 katori rice + 1 katori chhanar dalna (paneer) + 1 katori tarkari + salad", d: "v", tags: "PD" },
    { t: "1 katori vegetable khichuri (rice + moong dal) + 1 katori tarkari + salad", d: "v" },
  ],
  north: [
    { t: "2 rotis + 1 katori dal + 1 katori seasonal sabzi + salad + 1 small katori curd", d: "v", tags: "D" },
    { t: "2 rotis + 2 small pieces chicken curry (little oil) + 1 katori sabzi + salad", d: "n", tags: "P" },
    { t: "2 rotis + 1 egg curry + 1 katori dal + salad", d: "e", tags: "PP" },
    { t: "2 rotis + 1 egg curry + 1 katori sabzi + salad", d: "e", tags: "P" },
    { t: "1 katori rice + 1 katori rajma or chole + 1 katori sabzi + salad", d: "v", tags: "KP" },
    { t: "2 rotis + 1 katori lauki chana dal + 1 katori sabzi + salad", d: "v" },
    { t: "1 katori vegetable pulao (little oil) + 1 katori dal + 1 katori raita", d: "v", tags: "D" },
    { t: "2 rotis + 1 katori palak paneer + 1 katori dal + salad", d: "v", tags: "KPPD" },
  ],
  south: [
    { t: "1 katori rice + 1 katori sambar + 1 katori vegetable poriyal + 1 small katori curd", d: "v", tags: "KD" },
    { t: "1 katori rice + 1 piece fish curry + 1 katori poriyal + 1 small bowl rasam", d: "n", tags: "P" },
    { t: "1 katori rice + 1 egg curry + 1 katori kootu (vegetable-dal) + salad", d: "e", tags: "P" },
    { t: "2 chapatis + 1 katori dal + 1 katori avial (little coconut) + salad", d: "v" },
    { t: "1 katori millet (ragi/foxtail) rice + 1 katori dal + 1 katori vegetable + buttermilk", d: "v", tags: "D" },
    { t: "1 katori rice + 1 katori moong dal + 1 katori beans/cabbage poriyal + salad", d: "v" },
  ],
}

const EVENING: Opt[] = [
  { t: "1 cup tea without sugar + 1 bowl muri (puffed rice) with cucumber and onion", d: "v" },
  { t: "1 cup tea without sugar + 2 tablespoons roasted chana", d: "v", tags: "KP" },
  { t: "1 cup clear vegetable soup (no cream)", d: "v", tags: "K" },
  { t: "1 cup tea without sugar + 2 Marie biscuits or cream crackers", d: "v" },
  { t: "1 boiled egg + 1 cup tea without sugar", d: "e", tags: "P" },
  { t: "1 small bowl roasted makhana (fox nuts)", d: "v", tags: "K" },
  { t: "1 small bowl sprouts chaat", d: "v", tags: "KP" },
  { t: "1 small bowl suji (rava) upma with onion", d: "v" },
  { t: "1 egg-white omelette + 1 cup tea without sugar", d: "e", tags: "P" },
  { t: "1 small bowl murmura (puffed rice) chiwda, no salt or oil", d: "v" },
]

const DINNER: Record<Region, Opt[]> = {
  bengali: [
    { t: "2 rotis + 1 piece fish jhol (little oil) + 1 katori tarkari", d: "n", tags: "P" },
    { t: "2 rotis + 1 katori chicken stew with vegetables", d: "n", tags: "P" },
    { t: "2 rotis + 1 egg curry + 1 katori lau ghonto", d: "e", tags: "P" },
    { t: "2 rotis + 1 katori dal + 1 katori mixed vegetables", d: "v" },
    { t: "1 katori vegetable khichuri + 1 katori tarkari", d: "v" },
    { t: "1 bowl vegetable daliya khichuri + salad", d: "v" },
    { t: "2 rotis + 1 katori chhanar dalna (paneer) + salad", d: "v", tags: "PD" },
  ],
  north: [
    { t: "2 rotis + 1 katori dal + 1 katori lauki or tori sabzi", d: "v" },
    { t: "1 bowl moong dal khichdi + 1 small katori raita", d: "v", tags: "D" },
    { t: "2 rotis + 1 katori chicken stew with vegetables", d: "n", tags: "P" },
    { t: "2 rotis + 1 egg bhurji + 1 katori sabzi", d: "e", tags: "P" },
    { t: "1 bowl vegetable daliya + salad", d: "v" },
    { t: "2 rotis + 1 katori paneer bhurji + 1 katori sabzi", d: "v", tags: "PD" },
  ],
  south: [
    { t: "2 chapatis + 1 katori vegetable kurma (little coconut)", d: "v" },
    { t: "2 ragi dosas + ½ katori sambar", d: "v", tags: "K" },
    { t: "1 bowl vegetable upma + 1 small katori curd", d: "v", tags: "D" },
    { t: "2 chapatis + 1 piece fish curry + 1 katori poriyal", d: "n", tags: "P" },
    { t: "2 chapatis + 1 egg curry + 1 katori poriyal", d: "e", tags: "P" },
    { t: "2 idlis + 1 katori vegetable kootu", d: "v" },
  ],
}

const BEDTIME: Opt[] = [
  { t: "1 cup warm toned milk, no sugar", d: "v", tags: "D" },
  { t: "1 small apple", d: "v" },
  { t: "2 Marie biscuits or 1 small rusk", d: "v" },
  { t: "1 glass buttermilk, no sugar", d: "v", tags: "D" },
  { t: "1 small pear", d: "v" },
]

export type StdInput = {
  condition: string
  food: string // "Vegetarian" | "Eggetarian" | "Non-vegetarian (...)"
  style: string // "Bengali" | "North Indian" | "South Indian" | "Any Indian"
  profile?: Record<string, unknown>
  bmi?: number
}

export function standardChart(inp: StdInput): { text: string; topics: string[] } {
  const c = inp.condition.toLowerCase()
  const p = inp.profile ?? {}
  const n = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN)
  const diet = /non/i.test(inp.food) ? "n" : /egg/i.test(inp.food) ? "e" : "v"
  const region: Region = /north/i.test(inp.style) ? "north" : /south/i.test(inp.style) ? "south" : "bengali"
  const anyStyle = /any/i.test(inp.style)

  const diabetes = /diabet/.test(c) || !isNaN(n(p.hba1c)) || !isNaN(n(p.fbs))
  const ckd = /kidney|ckd|renal/.test(c) || p.dialysis === true
  const dialysis = p.dialysis === true
  const highK = n(p.potassium) > 5 || dialysis
  const thyroid = /thyroid/.test(c)
  const insulin = p.insulin === true
  const bmi = inp.bmi
  const under = bmi !== undefined && bmi < 18.5
  const over = (bmi !== undefined && bmi >= 23) || /weight loss/.test(c)

  const okDiet = (o: Opt) => o.d === "v" || (o.d === "e" && diet !== "v") || (o.d === "n" && diet === "n")
  const okCond = (o: Opt) => {
    const t = o.tags ?? ""
    if (diabetes && t.includes("S")) return false
    if (highK && t.includes("K")) return false
    if (ckd && !dialysis && t.includes("PP")) return false // CKD G3–G5: one protein food per meal (KDIGO 0.8 g/kg)
    if (dialysis && t.includes("D")) return false
    return true
  }
  // Non-veg/egg eaters: lead with their options so the 4 shown include them.
  const rank = (o: Opt) => (o.d === diet ? 0 : diet === "n" && o.d === "e" ? 1 : 2)
  const pick = (list: Opt[], fallback: Opt[] = []) => {
    const ok = [...list, ...fallback].filter((o) => okDiet(o) && okCond(o))
    const seen = new Set<string>()
    const uniq = ok.filter((o) => !seen.has(o.t) && seen.add(o.t))
    const sorted = uniq.map((o, i) => ({ o, i })).sort((a, b) => rank(a.o) - rank(b.o) || a.i - b.i).map((x) => x.o)
    // keep a mix: at most 2 of the leading diet type, rest vegetarian, when possible
    const lead = sorted.filter((o) => o.d !== "v").slice(0, diet === "v" ? 0 : 2)
    const veg = sorted.filter((o) => o.d === "v")
    return [...lead, ...veg, ...sorted].filter((o, i, a) => a.indexOf(o) === i).slice(0, 4)
  }
  const fromRegions = (m: Record<Region, Opt[]>) =>
    anyStyle ? [m.bengali[0], m.north[0], m.south[0], ...m.bengali.slice(1), ...m.north.slice(1), ...m.south.slice(1)] : m[region]
  const other = (m: Record<Region, Opt[]>) => (Object.keys(m) as Region[]).filter((r) => r !== region).flatMap((r) => m[r])

  const row = (label: string, opts: Opt[]) => `| ${label} | ${opts.map((o, i) => `${i + 1}. ${o.t}`).join(" <br>")} |`

  const rows: string[] = []
  const early = pick(EARLY)
  rows.push(row(thyroid ? "Early morning (6–7 am) — thyroid tablet first with plain water, then wait about 60 minutes" : "Early morning (6–7 am)", early))
  rows.push(row("Breakfast (8–9 am)", pick(fromRegions(BREAKFAST), other(BREAKFAST))))
  rows.push(row("Mid-morning (11 am)", pick(MID)))
  rows.push(row("Lunch (1–2 pm)", pick(fromRegions(LUNCH), other(LUNCH))))
  rows.push(row("Evening snack (5 pm)", pick(EVENING)))
  rows.push(row("Dinner (8–9 pm)", pick(fromRegions(DINNER), other(DINNER))))
  if (insulin || under) rows.push(row("Bedtime (10 pm)", pick(BEDTIME)))

  const tips: string[] = []
  if (over) tips.push("Portions: keep rice to 1 katori or 2 rotis per main meal, and fill half the plate with vegetables or salad.")
  if (under) tips.push("Portions: add 1 extra roti or ½ katori rice at lunch and dinner, and have the bedtime snack.")
  if (diabetes) tips.push("No sugar, sweets, fruit juice or soft drinks. Eat at the same times every day and walk 10–15 minutes after meals.")
  if (insulin) tips.push("On insulin: never skip a meal, keep carbohydrate the same each day, and carry sugar or glucose for lows. Only your doctor changes insulin doses.")
  if (/hypertension|blood pressure/.test(c)) tips.push("Salt under 1 level teaspoon (5 g) a day; avoid pickles, papad, chips, sauces and packaged foods.")
  if (/heart|cholesterol/.test(c)) tips.push(`Limit ghee, butter, red meat, fried and bakery foods; ${diet === "n" ? "have fish twice a week, and " : ""}dal, oats, vegetables and a few nuts daily.`)
  if (ckd) {
    tips.push(dialysis ? "On dialysis: include protein at every meal as shown, follow your kidney doctor's fluid limit, and avoid colas and packaged foods." : `Kidney care: one protein food per meal as shown — when you have ${diet === "n" ? "fish, egg, chicken or paneer" : diet === "e" ? "egg or paneer" : "paneer"}, keep dal to ½ katori. Avoid colas, packaged and processed foods.`)
    tips.push("Salt under 5 g a day and never use low-sodium salt (it contains potassium).")
    if (highK) tips.push("High potassium: leach all vegetables before cooking — cut, soak in warm water, boil and throw away the water. Avoid coconut water, bananas, oranges, papaya, dry fruits, potato and vegetable soups.")
  }
  if (thyroid) tips.push("Thyroid: take the tablet on an empty stomach with plain water about 60 minutes before tea or breakfast; keep calcium/iron tablets a few hours apart. Use iodised salt within 5 g a day.")
  if (!tips.length || /general/.test(c)) tips.push("Salt under 5 g a day, about 5–6 teaspoons of oil a day in total, plenty of vegetables, whole grains and dal; avoid fried and packaged foods.")

  const title = `**Standard 1-day diet chart${ckd ? " (kidney-friendly" + (highK ? ", low potassium" : "") + ")" : ""} — choose any ONE option in each row**`
  const text = [
    title,
    "",
    "| Time & meal | Choose any ONE of these 4 options (portion) |",
    "|---|---|",
    ...rows,
    "",
    ...tips.slice(0, 5).map((t) => `- ${t}`),
    "",
    "This is a general sample chart. Your exact needs depend on your health, medicines and activity, so please review it with Dr. Samanta.",
  ].join("\n")

  const topics = ["general"]
  if (diabetes) topics.push("diabetes")
  if (/hypertension|blood pressure/.test(c)) topics.push("hypertension")
  if (/heart|cholesterol/.test(c)) topics.push("heart")
  if (ckd) topics.push("kidney")
  if (thyroid) topics.push("thyroid")
  if (/weight/.test(c)) topics.push("weight")
  return { text, topics }
}

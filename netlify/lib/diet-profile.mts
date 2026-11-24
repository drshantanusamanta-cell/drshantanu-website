// Turns the optional details from the diet-chart form into
//  (1) checked numbers and plain facts for the AI to tune the chart,
//  (2) a short "Your details" summary shown to the patient (computed here, never by the AI),
//  (3) urgent warnings for dangerous values, and
//  (4) which reference topics apply.
// Sources: BMI cut-offs — Misra A, et al. Diabetes Metab Syndr 2025 (Asian Indians);
// eGFR — 2021 CKD-EPI creatinine equation (Inker LA, et al. NEJM 2021);
// protein — KDIGO 2024 (0.8 g/kg/d, CKD G3–G5) and KDOQI 2020 (1.0–1.2 g/kg/d on dialysis).

export type Profile = Record<string, unknown>

export type Analysis = {
  facts: string // for the AI
  summary: string // markdown for the patient
  urgent: string[] // markdown lines, shown first
  topics: string[] // reference topics
  child: boolean
  bmi?: number
}

const num = (v: unknown, min: number, max: number): number | undefined => {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined
}
const r1 = (n: number) => Math.round(n * 10) / 10

export function egfrCkdEpi2021(scr: number, age: number, female: boolean): number {
  const k = female ? 0.7 : 0.9
  const a = female ? -0.241 : -0.302
  const ratio = scr / k
  return 142 * Math.pow(Math.min(ratio, 1), a) * Math.pow(Math.max(ratio, 1), -1.2) * Math.pow(0.9938, age) * (female ? 1.012 : 1)
}

export function ckdStage(egfr: number): string {
  if (egfr >= 90) return "G1"
  if (egfr >= 60) return "G2"
  if (egfr >= 45) return "G3a"
  if (egfr >= 30) return "G3b"
  if (egfr >= 15) return "G4"
  return "G5"
}

export function analyzeProfile(p: Profile | undefined, condition: string): Analysis {
  const out: Analysis = { facts: "", summary: "", urgent: [], topics: [], child: false }
  if (!p || typeof p !== "object") return out

  const age = num(p.age, 1, 110)
  const sex = p.sex === "female" ? "female" : p.sex === "male" ? "male" : undefined
  const weight = num(p.weight, 20, 250)
  const height = num(p.height, 100, 230)
  const activity = ["sedentary", "moderate", "active"].includes(String(p.activity)) ? String(p.activity) : undefined
  const fbs = num(p.fbs, 20, 800)
  const ppbs = num(p.ppbs, 20, 900)
  const hba1c = num(p.hba1c, 3, 20)
  const insulin = p.insulin === true
  const sbp = num(p.sbp, 60, 300)
  const dbp = num(p.dbp, 30, 200)
  const ldl = num(p.ldl, 10, 500)
  const tg = num(p.tg, 10, 5000)
  const urea = num(p.urea, 2, 500)
  const creat = num(p.creatinine, 0.1, 25)
  const k = num(p.potassium, 1.5, 10)
  const dialysis = p.dialysis === true
  const tsh = num(p.tsh, 0.005, 200)
  const thyroxine = p.thyroxine === true

  const facts: string[] = []
  const lines: string[] = []
  const who: string[] = []
  if (age !== undefined) who.push(`Age ${age}`)
  if (sex) who.push(sex === "female" ? "Female" : "Male")
  if (weight !== undefined) who.push(`${weight} kg`)
  if (height !== undefined) who.push(`${height} cm`)
  if (activity) who.push(`${activity[0].toUpperCase()}${activity.slice(1)} activity`)
  if (who.length) facts.push(`Basic details: ${who.join(", ")}.`)

  if (age !== undefined && age < 18) {
    out.child = true
    facts.push("The patient is under 18: give only general healthy-eating advice for children, no weight-loss chart and no restrictions; say a paediatric plan must come from the doctor.")
  }

  // BMI (Asian Indian cut-offs)
  let refWeight = weight
  if (weight !== undefined && height !== undefined && out.child) {
    const bmi = weight / Math.pow(height / 100, 2)
    lines.push(`BMI ${r1(bmi)} — adult cut-offs do not apply under 18; please ask the doctor about a healthy weight`)
  } else if (weight !== undefined && height !== undefined) {
    const bmi = weight / Math.pow(height / 100, 2)
    let cat: string
    let advice: string
    if (bmi < 18.5) { cat = "below the healthy range"; advice = "underweight: slightly larger portions and protein-rich snacks; no weight loss" }
    else if (bmi < 23) { cat = "healthy range for Indians"; advice = "healthy weight: keep portions moderate to maintain weight" }
    else if (bmi < 25) { cat = "overweight range for Indians"; advice = "overweight: slightly smaller cereal/rice portions for gentle weight loss" }
    else { cat = "obesity range for Indians"; advice = "obesity: smaller cereal/rice portions, more vegetables and salad, no fried snacks, for gradual weight loss of about 0.5 kg a week" }
    if (bmi >= 25) refWeight = 23 * Math.pow(height / 100, 2)
    out.bmi = bmi
    lines.push(`**BMI ${r1(bmi)}** — ${cat} (Indian cut-offs: healthy 18.5–22.9)`)
    facts.push(`BMI ${r1(bmi)} (${cat}). Tune portions for ${advice}.`)
    out.topics.push("bmi")
  }
  if (activity) facts.push(`Activity level: ${activity} — adjust cereal portions accordingly (larger if active, smaller if sedentary).`)

  // Diabetes
  if (hba1c !== undefined) {
    let t: string
    if (hba1c < 5.7) t = "in the normal range"
    else if (hba1c < 6.5) t = "in the prediabetes range"
    else if (hba1c < 7) t = "in the diabetes range, near the usual target of under 7%"
    else if (hba1c <= 8) t = "above the usual target of under 7%"
    else t = "well above the usual target of under 7%"
    lines.push(`HbA1c ${hba1c}% — ${t}`)
    facts.push(`HbA1c ${hba1c}% (${t}).${hba1c >= 7 ? " Keep carbohydrate portions small and steady, no sugar, prefer high-fibre whole grains and millets." : ""}`)
    out.topics.push("diabetes")
  }
  if (fbs !== undefined) {
    let t: string
    if (fbs < 70) t = "low"
    else if (fbs < 100) t = "normal"
    else if (fbs < 126) t = "in the prediabetes range"
    else if (fbs < 250) t = "in the diabetes range"
    else t = "very high"
    lines.push(`Fasting sugar ${fbs} mg/dL — ${t}`)
    facts.push(`Fasting blood sugar ${fbs} mg/dL (${t}).`)
    out.topics.push("diabetes")
    if (fbs < 70) out.urgent.push(`Your fasting sugar (${fbs} mg/dL) is **low**. If you feel shaky, sweaty or confused, take 3 teaspoons of sugar or glucose in water now, recheck after 15 minutes, and contact your doctor today.`)
    else if (fbs >= 300) out.urgent.push(`Your fasting sugar (${fbs} mg/dL) is **very high**. Please contact Dr. Samanta today. If you feel drowsy, are vomiting or breathing fast, go to the nearest emergency or call 112.`)
  }
  if (ppbs !== undefined) {
    const t = ppbs < 70 ? "low" : ppbs < 140 ? "normal" : ppbs < 200 ? "high" : "in the diabetes range"
    lines.push(`After-meal sugar ${ppbs} mg/dL — ${t}`)
    facts.push(`Post-meal blood sugar ${ppbs} mg/dL (${t}).${ppbs >= 180 ? " Keep lunch and dinner cereal portions small; add vegetables and protein first." : ""}`)
    out.topics.push("diabetes")
    if (ppbs < 70 && !out.urgent.some((u) => u.includes("low"))) out.urgent.push(`Your after-meal sugar (${ppbs} mg/dL) is **low**. Take 3 teaspoons of sugar or glucose in water now if you have symptoms, and contact your doctor today.`)
    else if (ppbs >= 400) out.urgent.push(`Your after-meal sugar (${ppbs} mg/dL) is **very high**. Please contact Dr. Samanta today.`)
  }
  if (insulin) {
    facts.push("On insulin: same meal times every day, never skip meals, steady carbohydrate at each meal, include a small bedtime snack, and carry sugar for lows. Say insulin doses must only be changed by the doctor.")
    lines.push("On insulin — the chart keeps meal times and carbohydrate steady")
    out.topics.push("diabetes")
  }

  // Blood pressure
  if (sbp !== undefined || dbp !== undefined) {
    const s = sbp ?? 0, d = dbp ?? 0
    let t: string
    if (s >= 180 || d >= 120) t = "very high"
    else if (s >= 140 || d >= 90) t = "high"
    else if (s >= 130 || d >= 80) t = "raised"
    else t = "in the normal range"
    const bp = `${sbp ?? "–"}/${dbp ?? "–"}`
    lines.push(`BP ${bp} mmHg — ${t}`)
    facts.push(`Blood pressure ${bp} mmHg (${t}). Strict low-salt DASH-style choices.`)
    out.topics.push("hypertension")
    if (t === "very high") out.urgent.push(`Your BP (${bp}) is **very high**. If you have chest pain, breathlessness, severe headache, weakness or confusion, call 112 or go to the nearest emergency now. Otherwise contact Dr. Samanta today.`)
  }

  // Lipids
  if (ldl !== undefined) {
    const t = ldl >= 190 ? "very high" : ldl >= 160 ? "high" : ldl >= 130 ? "borderline high" : ldl >= 100 ? "above optimal" : "optimal"
    lines.push(`LDL cholesterol ${ldl} mg/dL — ${t}`)
    facts.push(`LDL cholesterol ${ldl} mg/dL (${t}). Limit ghee, butter, red meat, fried and bakery foods; more fibre (oats, dal, vegetables), fish, nuts.`)
    out.topics.push("heart")
  }
  if (tg !== undefined) {
    const t = tg >= 500 ? "very high" : tg >= 200 ? "high" : tg >= 150 ? "borderline high" : "normal"
    lines.push(`Triglycerides ${tg} mg/dL — ${t}`)
    facts.push(`Triglycerides ${tg} mg/dL (${t}). Cut sugar, sweets, refined flour, large rice portions and alcohol.${tg >= 500 ? " Very low fat as well." : ""}`)
    out.topics.push("heart")
    if (tg >= 1000) out.urgent.push(`Your triglycerides (${tg} mg/dL) are **extremely high**, which can inflame the pancreas. Please contact Dr. Samanta soon; go to emergency if you get severe belly pain.`)
  }

  // Thyroid (ATA 2014: levothyroxine ~60 min before breakfast, consistently)
  const thyroidCondition = /thyroid/i.test(condition)
  if (tsh !== undefined) {
    const t = tsh < 0.4 ? "low" : tsh <= 4.5 ? "within the usual range" : tsh <= 10 ? "raised" : "high"
    lines.push(`TSH ${tsh} mIU/L — ${t}${tsh > 4.5 || tsh < 0.4 ? " (please discuss your thyroid dose with Dr. Samanta; never change it yourself)" : ""}`)
    facts.push(`TSH ${tsh} mIU/L (${t}).${tsh > 4.5 ? " Thyroid is under-treated or untreated: weight-control portions, high-fibre foods for constipation, and advise reviewing the dose with the doctor (do not suggest a dose)." : tsh < 0.4 ? " TSH is low: advise reviewing the dose with the doctor (do not suggest a dose)." : ""}`)
    out.topics.push("thyroid")
  }
  if (thyroidCondition || thyroxine) {
    out.topics.push("thyroid")
    facts.push(`Hypothyroidism${thyroxine ? ", on thyroxine (levothyroxine)" : ""}: ${thyroxine ? "in the Early morning row, first say to take the thyroid tablet with plain water on an empty stomach and wait about 60 minutes before tea, milk or breakfast; keep calcium or iron tablets and soy foods a few hours away from it. " : ""}Use iodised salt but stay within 5 g a day. Normal cooked portions of cabbage, cauliflower and broccoli are fine; no raw-goitrogen or 'thyroid cure' diets, no supplements (selenium/iodine tablets) unless the doctor advises. Weight-control portions and fibre for constipation.`)
    if (thyroxine) lines.push("On thyroxine — the chart keeps the tablet on an empty stomach, about 60 minutes before breakfast")
  }

  // Kidney
  const kidneyCondition = /kidney|ckd|renal/i.test(condition)
  let egfr: number | undefined
  if (creat !== undefined) {
    if (dialysis) {
      lines.push(`Creatinine ${creat} mg/dL (on dialysis, so kidney function is not estimated from it)`)
      facts.push(`Serum creatinine ${creat} mg/dL (on dialysis).`)
    } else if (age !== undefined && age >= 18 && sex) {
      egfr = egfrCkdEpi2021(creat, age, sex === "female")
      const st = ckdStage(egfr)
      lines.push(`Creatinine ${creat} mg/dL → **eGFR about ${Math.round(egfr)}** mL/min/1.73m² (CKD-EPI 2021) — kidney function stage ${st}`)
      facts.push(`Serum creatinine ${creat} mg/dL, estimated GFR ${Math.round(egfr)} mL/min/1.73m² (CKD stage ${st}).`)
      out.topics.push("egfr")
    } else {
      lines.push(`Creatinine ${creat} mg/dL (add age and sex to estimate kidney function)`)
      facts.push(`Serum creatinine ${creat} mg/dL${creat > 1.3 ? " (raised)" : ""}.`)
    }
  }
  if (urea !== undefined) {
    const t = urea > 45 ? "raised" : "within the usual range"
    lines.push(`Urea ${urea} mg/dL — ${t}`)
    facts.push(`Blood urea ${urea} mg/dL (${t}).`)
  }
  if (k !== undefined) {
    const t = k < 3.5 ? "low" : k <= 5.0 ? "normal" : k < 6 ? "high" : "dangerously high"
    lines.push(`Potassium ${k} mmol/L — ${t}${k > 5 ? ": the chart uses low-potassium foods" : ""}`)
    facts.push(`Serum potassium ${k} mmol/L (${t}).${k > 5 ? " Use low-potassium foods only: avoid coconut water, banana, orange/mosambi juice, dry fruits, potato, tomato-heavy gravies, and salt substitutes (low-sodium salt contains potassium). Leach vegetables: cut, soak in warm water, boil and throw away the water." : k < 3.5 ? " Potassium is low: tell them to discuss with the doctor; do not suggest supplements." : ""}`)
    if (k >= 6) out.urgent.push(`Your potassium (${k} mmol/L) is **dangerously high** and can affect the heart. Please contact Dr. Samanta or go to the nearest emergency **today**.`)
  }
  if (dialysis) facts.push("On dialysis: protein should be higher (about 1.0–1.2 g/kg/day, e.g. egg white, fish, chicken, paneer in measured amounts); limit salt strictly; follow the nephrologist's fluid limit; limit high-potassium and high-phosphorus foods (colas, packaged and processed foods).")

  const isCkd = dialysis || kidneyCondition || (egfr !== undefined && egfr < 60)
  if (isCkd) {
    out.topics.push("kidney")
    const range = dialysis ? [1.0, 1.2] : [0.8, 0.8]
    const basis = dialysis ? "1.0–1.2 g/kg, KDOQI 2020, on dialysis" : "0.8 g/kg, KDIGO 2024"
    if (refWeight !== undefined) {
      const lo = Math.round(refWeight * range[0]), hi = Math.round(refWeight * range[1])
      const g = lo === hi ? `${lo} g` : `${lo}–${hi} g`
      lines.push(`**Protein target about ${g} a day** (${basis}${weight !== undefined && refWeight !== weight ? ", using a healthy reference weight" : ""})`)
      facts.push(`Daily protein target about ${g} (${basis}). Divide protein between meals and keep dal/meat/fish/egg/paneer portions within this; do not give high-protein options (avoid more than 1.3 g/kg). Salt under 5 g a day (sodium under 2 g). Limit phosphorus: colas, packaged/processed foods, processed cheese.`)
    } else {
      lines.push(`Protein target: ${dialysis ? "1.0–1.2" : "0.8"} g per kg body weight a day (${basis}) — add your weight for grams`)
      facts.push(`Protein about ${dialysis ? "1.0–1.2" : "0.8"} g/kg/day (${basis}); keep protein portions moderate. Salt under 5 g a day. Limit phosphorus: colas, packaged/processed foods.`)
    }
    if (!dialysis && egfr !== undefined && egfr < 15) out.urgent.push(`Your estimated kidney function (eGFR about ${Math.round(egfr)}) is **very low**. This chart cannot replace your kidney specialist's plan — please see your doctor soon.`)
  }

  out.topics = [...new Set(out.topics)]
  if (lines.length || who.length) {
    out.summary = `**Your details used** ${who.length ? `(${who.join(" · ")})` : ""}\n${lines.map((l) => `- ${l}`).join("\n")}`.trim()
  }
  if (facts.length) out.facts = `Patient details (use these to tune the chart; do not recalculate or restate the numbers):\n- ${facts.join("\n- ")}`
  return out
}

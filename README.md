# drshantanu — Dr. Shantanu Samanta, Consultant General Physician (Kolkata)

Live: https://drshantanusamanta.in (Netlify project "drshantanu")

## Layout
```
public/index.html                 the website (single page)
netlify/functions/gemini.mts      AI Health Assistant: chat, diet charts, report simplifier (/api/gemini)
netlify/functions/counter.mjs     visitor counter, Netlify Blobs (/api/counter)
netlify.toml                      publish = public, functions = netlify/functions, no build step
package.json                      @netlify/blobs, @netlify/functions
```

## Settings needed in Netlify
- `GEMINI_API_KEY` (environment variable, scope must include Functions). Never put the key in the code.
- Optional `GEMINI_MODEL` to try a specific Gemini model first.

## Diet chart references
Diet answers end with fixed, verified references added by the server (never written by the AI):
ICMR-NIN Dietary Guidelines for Indians 2024; RSSDI 2022 T2DM recommendations; ADA Standards of Care 2026 §5;
NHLBI DASH Eating Plan; AHA 2021 Dietary Guidance. Edit them in `REFS` inside `gemini.mts`.

## Deploys
Netlify deploys automatically from the `main` branch. Note: deploying by dragging the folder onto Netlify Drop skips the functions, so the chat and counter would stop working.

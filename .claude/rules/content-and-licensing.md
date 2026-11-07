---
paths:
  - "docs/**"
  - "lib/classics/**"
  - "lib/nihai/**"
  - "lib/seo/**"
  - "README.md"
  - "README.zh-CN.md"
  - "DATASET-LICENSE"
---

# Content and licensing rules

These files carry quoted sources and licence terms. Accuracy matters more than polish.

- **Never fabricate or paraphrase a quotation.** Text attributed to 倪海厦 (《天纪》), 《紫微斗数全书》, 《全集》 or 《骨髓赋》 must be verbatim and traceable (book and chapter, or episode and time code). If you can't verify a quote, say so; don't write a plausible-sounding one. Removing unsourced citations was a whole release cycle's work (README 2026-10-15).
- `docs/tianji-ziwei/` is synced from the sister repo `nihai-tianji-corpus` and is licensed **CC BY-NC-SA 4.0 (non-commercial)**. Don't edit it here (a hook blocks it); corrections go upstream.
- Licences differ by area. Keep them separate when you write about them: code is MIT, the datasets are CC BY 4.0, classical texts are public domain, and 倪师 quotes are CC BY-NC-SA. Don't describe quoted 倪师 material as covered by the dataset licence.
- `lib/classics/` holds public-domain originals. Fix transcription errors only against a cited edition; don't modernise or "correct" the classical wording.
- README is bilingual: `README.md` (English, the default shown on GitHub; a summary) and `README.zh-CN.md` (Chinese, the full text). A factual change to one (numbers, licence terms, the open-source boundary) must be mirrored in the other.
- README updates follow the existing pattern: a dated note, newest first, with credit to contributors and links to issue and PR numbers. It's `> **YYYY-MM-DD addendum**: …` in `README.md` and `> **YYYY-MM-DD 补充**：…` in `README.zh-CN.md`.
- Don't state dataset statistics, line counts or "matches the live site" claims unless you've measured them. The README has had to correct exactly these claims before.

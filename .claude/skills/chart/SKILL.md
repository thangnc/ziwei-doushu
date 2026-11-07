---
name: chart
description: Generate a Zi Wei Dou Shu chart from birth data with this repo's engine and print palaces, stars, brightness, 四化, 大限 and 格局. Use when checking whether a chart is correct, triaging a "chart result question" issue, reproducing a reported wrong placement, or verifying what an engine change does to a specific birth.
argument-hint: "<YYYY-MM-DD> <HH:MM | hour index 0-11> <male|female> [longitude]"
allowed-tools: Bash(npx tsx .claude/skills/chart/chart.ts *)
---

# chart

Run the engine on real input instead of reasoning about what `generateChart` would produce.

## Run it

```bash
# From a clock time: goes through formToBirthInfo (true solar time and late-子时 day change), like the UI does
npx tsx .claude/skills/chart/chart.ts --date 1990-05-09 --time 23:30 --gender female --lng 100

# From a 时辰 branch index (0=子 … 11=亥), with no time correction (the dataset convention)
npx tsx .claude/skills/chart/chart.ts --date 1990-05-10 --hour 0 --gender female
```

Optional flags:
- `--leap split|next-month|prev-month|origin-month`: leap-month policy. The default is `split`.
- `--school QS|XD1|ZZ|XD2`: brightness school. The default is `QS` (《斗数全书》).
- `--json`: the full `ZiweiChart` object.

Map `$ARGUMENTS` onto these flags:
- A value such as `23:30` is `--time`.
- A bare integer from 0 to 11 is `--hour`.
- A trailing number such as `116.4` is `--lng`.

If the gender is missing, ask for it. Don't guess.

## Read the output

- Line 1: the charting day, 时辰, lunar date, year 干支, 五行局, 命宫/身宫 branches, 命主/身主 and 阴阳.
- With `--time`, line 2 shows how the clock time became the charting day and branch. Check this line first when someone reports a wrong chart. Most "wrong chart" reports turn out to be a time-correction or late-子时 issue, not a star-placement bug.
- Each palace line is `干支 宫名<命/身> 大限岁数: 星(亮度)[化X] … {自化}`. Palaces are sorted 子 → 亥.
- iztro names: only 命宫 keeps 「宫」, and 交友 is called 仆役.

## Triaging a disputed chart

1. Reproduce it with exactly the reporter's input: date, clock time, birthplace longitude and gender.
2. If their reference software disagrees, rule out policy differences before calling it a bug:
   - year boundary (正月初一, not 立春)
   - leap-month policy (`--leap`)
   - late-子时 rule
   - brightness school (`--school`)
   - whether true solar time was applied
3. Report the specific stars and palaces that differ, and which policy (if any) explains each one.

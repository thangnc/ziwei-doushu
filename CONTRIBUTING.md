# Contributing

Questions, fixes and suggestions are welcome. Two things up front will save a lot of back-and-forth:

- This repo is an **open snapshot** of the charting engine behind [ouranic.cn](https://ouranic.cn/?from=gh-contrib), synced from production periodically. The release cadence is in [`README.zh-CN.md`](./README.zh-CN.md) §八「维护节奏与贡献」.
- The open-source version **does not include** the interpretation database, the AI prompts or any `/api/*` backend route; see "What is not included" in the [README](./README.md). AI interpretation and compatibility (合盘) analysis return 404 here by design; you'd need to implement them yourself.

## Asking questions

- **How to use it, or general discussion**: use [Discussions](https://github.com/Renhuai123/ziwei-doushu/discussions).
- **You think a chart is wrong**: use the "Chart result question" form. Include the Gregorian birth date, the time to the minute, the birthplace or longitude, the gender, this project's result and the result you compared it with. A bare "it's inaccurate" can't be investigated.
  - Supporting-star brightness, leap-month assignment and whether the late 子时 changes the day differ between schools by design, and the engine makes them switchable options. Such differences aren't bugs, but pointing them out is still welcome.
- **Errors or broken pages**: use the "Bug report" form, with steps to reproduce and the error message.
- **Problems with the live site (ouranic.cn)**: use the "ouranic.cn issue" form.

Please don't post phone numbers, verification codes, or anyone else's birth data without their consent.

## Submitting code

```bash
npm ci               # install from package-lock.json
npm run typecheck    # type check
npm test             # chart regression tests
```

- One change per PR. Say what changed and why in the description.
- **If it changes chart results**: attach evidence (a cited source, or a screenshot from other charting software), and add a regression test under `scripts/regression/`, registered in the `test` script in `package.json`. Changes to a convention without a source are generally not accepted.
- CI runs the same checks on every push and PR, on Node 24 (see `.nvmrc`).
- New comments, docs and commit messages are written in English. Chart terms that are engine identifiers (四化, 大限, 时辰, star and palace names) stay in Chinese. Don't translate existing Chinese comments as part of an unrelated change.

## License

By contributing, you agree that your contribution is released under the matching license:

- Code: [MIT](./LICENSE)
- Sample dataset: [CC BY 4.0](./DATASET-LICENSE)
- Ni Haixia quotations in `docs/tianji-ziwei/`: [CC BY-NC-SA 4.0](./docs/tianji-ziwei/LICENSE.md), non-commercial only

---

**中文.** 欢迎提问题、提修复、提建议。本仓库是 ouranic.cn 排盘引擎的开源快照，不含断语库、AI 解读提示词和任何 `/api/*` 后端接口，AI 功能返回 404 属预期。觉得盘排得不对，请用「Chart result question」模板，附完整出生信息和对照结果。提 PR 前请跑 `npm ci`、`npm run typecheck` 和 `npm test`；改排盘结果的需要附出处并加回归测试。详细中文说明见 [README.zh-CN.md](./README.zh-CN.md)。

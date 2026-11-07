/**
 * 基线回归（change-detector）：排盘引擎输出（剔除依赖当天日期的 currentAge / currentDaXianIndex / isCurrentDaXian）
 *
 * 只读：在内存里重新生成 body，与已提交的 scripts/regression/fixtures/engine-baseline.zh.jsonl.gz 逐字节比较。
 * - 只有 body 不一致才失败；Node / ICU / tzdata / git 等环境元数据差异只打印报告，不失败。
 * - 本测试从不写、不重建 fixture。更新 fixture 只能显式运行
 *   generate-baselines.ts --write（规范容器环境），并附 chart-diff-reviewer 报告与依据，见 fixtures/README.md。
 * fixture 只用来发现变化，不证明正确。
 */
import { buildEngineAndPatternBodies, verifyFixture } from './fixtures/baseline-lib';

// 用 async main 而不是顶层 await：tsx 在本仓库按 CJS 编译 .ts。
async function main() {
  const [body] = await buildEngineAndPatternBodies();
  if (!verifyFixture('engine-baseline.zh', body)) process.exit(1);
  console.log('engine-baseline regression passed');
}

main().catch((e) => { console.error(e); process.exit(1); });

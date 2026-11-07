/**
 * 显式生成基线 fixture。没有 --write 时拒绝运行，测试永远不会调用本脚本。
 *
 * 规范环境（canonical）：node:24.22.2-bookworm（linux/amd64，按 digest 固定），见 fixtures/README.md。
 *   在其他环境生成的 fixture 必须在 README 与提交说明里标注为 non-canonical。
 *
 * 用法：npx tsx scripts/regression/fixtures/generate-baselines.ts --write [--out <dir>]
 *       --check-determinism   生成两遍，比较 body sha256，不写文件
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { FIXTURE_DIR, FIXTURES, buildAllBodies, buildMeta, currentEnvironment, encodeBody, sha256 } from './baseline-lib';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 ? path.resolve(args[outIdx + 1]) : FIXTURE_DIR;

async function main() {
  if (args.includes('--check-determinism')) {
    const t0 = Date.now();
    const first = await buildAllBodies();
    const t1 = Date.now();
    const second = await buildAllBodies();
    let ok = true;
    for (let i = 0; i < first.length; i++) {
      const a = sha256(first[i].text), b = sha256(second[i].text);
      console.log(`${first[i].name}: run1 ${a}  run2 ${b}  ${a === b ? 'IDENTICAL' : 'DIFFERENT'}  (${first[i].records} records)`);
      ok &&= a === b;
    }
    console.log(`one generation took ${((t1 - t0) / 1000).toFixed(1)}s`);
    process.exit(ok ? 0 : 1);
  }

  if (!args.includes('--write')) {
    console.error('Refusing to run without --write. Fixtures are only regenerated deliberately, after review (see fixtures/README.md).');
    process.exit(2);
  }

  console.log('environment:', JSON.stringify(currentEnvironment()));
  const t0 = Date.now();
  const bodies = await buildAllBodies();
  mkdirSync(outDir, { recursive: true });
  for (const body of bodies) {
    const { bodyFile, metaFile } = FIXTURES[body.name];
    const gz = encodeBody(body.text);
    const meta = { ...buildMeta(body), storedBytes: gz.length };
    writeFileSync(path.join(outDir, bodyFile), gz);
    writeFileSync(path.join(outDir, metaFile), JSON.stringify(meta, null, 2) + '\n', 'utf8');
    console.log(`wrote ${bodyFile}: ${meta.records} records, ${meta.bodyBytes} bytes uncompressed, ${meta.storedBytes} bytes stored, sha256 ${meta.bodySha256}`);
  }
  console.log(`generation took ${((Date.now() - t0) / 1000).toFixed(1)}s → ${outDir}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

import { validateCatalog } from './lib/schema.mjs';

function loadYamlDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.yaml') && file !== 'topics.yaml')
    .sort()
    .map((file) => parseYaml(readFileSync(join(dir, file), 'utf8')));
}

function main() {
  const catalogDir = 'catalog';
  const packsDir = 'packs';
  const topicsPath = join(catalogDir, 'topics.yaml');

  if (!existsSync(topicsPath)) {
    console.error('validate: catalog/topics.yaml is missing');
    process.exit(1);
  }

  const topics = parseYaml(readFileSync(topicsPath, 'utf8'));
  const lists = loadYamlDir(catalogDir);
  const packs = loadYamlDir(packsDir);
  const errors = validateCatalog({ lists, packs, topics });

  if (errors.length > 0) {
    for (const error of errors) console.error(`validate: ${error}`);
    process.exit(1);
  }

  console.log(
    `validate: ${lists.length} lists, ${packs.length} packs, ${topics.length} topics — ok`,
  );
}

main();

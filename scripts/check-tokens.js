#!/usr/bin/env node
'use strict';

/*
 * Enforce the design-system usage rule.
 *
 * Scans .css, .html, .js, .jsx and .tsx files under src/ and styles/ and
 * fails on:
 *   - a #hex colour,
 *   - an rgb()/rgba()/hsl()/hsla() literal,
 *   - a var(--primitive-*) reference.
 *
 * Generated primitives.css is the only file exempt in full: it holds the raw
 * values. roles.css is scanned, but because it is the alias layer it is
 * allowed to contain var(--primitive-*) only inside role custom-property
 * definitions, and rgb() only inside --shadow-* definitions. Those two
 * constructs are required in the generated token layer. Interface code gets
 * no such allowance.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = ['src', 'styles'].map((dir) => path.join(ROOT, dir));
const EXTENSIONS = new Set(['.css', '.html', '.js', '.jsx', '.tsx']);
const EXEMPT = new Set(['styles/tokens/primitives.css']);
const ROLE_FILE = 'styles/tokens/roles.css';

const RULES = [
  {
    key: 'hex',
    label: 'raw hex colour',
    pattern:
      /(?<![\w-])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![\w-])/,
  },
  {
    key: 'function',
    label: 'rgb()/hsl() literal',
    pattern: /\b(?:rgb|hsl)a?\s*\(/i,
  },
  {
    key: 'primitive',
    label: 'primitive variable',
    pattern: /var\(\s*--primitive-/i,
  },
];

function relative(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function walk(dir, files) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (
      entry.isFile() &&
      EXTENSIONS.has(path.extname(entry.name).toLowerCase())
    ) {
      files.push(fullPath);
    }
  }
}

const files = [];
for (const dir of SCAN_DIRS) {
  walk(dir, files);
}

const scanned = files.filter((file) => !EXEMPT.has(relative(file)));
const offenses = [];
let readError = false;

for (const file of scanned) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    console.error(`Could not read ${relative(file)}: ${error.message}`);
    readError = true;
    continue;
  }

  const fileRel = relative(file);
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    const roleProperty =
      fileRel === ROLE_FILE
        ? /^\s*(--(?:color|spacing|radius|border-width|shadow)-[a-z0-9-]+)\s*:/.exec(
            line,
          )
        : null;
    const allowPrimitive = Boolean(
      roleProperty &&
        /^--(?:color|spacing|radius|border-width)-/.test(roleProperty[1]),
    );
    const allowRgb = Boolean(
      roleProperty && /^--shadow-/.test(roleProperty[1]),
    );

    const hits = RULES.filter((rule) => {
      if (rule.key === 'function' && allowRgb) return false;
      if (rule.key === 'primitive' && allowPrimitive) return false;
      return rule.pattern.test(line);
    }).map((rule) => rule.label);

    if (hits.length === 0) return;
    offenses.push({
      file: fileRel,
      line: index + 1,
      hits,
      text: line.trim(),
    });
  });
}

const exempt = files
  .map((file) => relative(file))
  .filter((file) => EXEMPT.has(file));

console.log(
  `Checking ${SCAN_DIRS.map((dir) => `${path.relative(ROOT, dir)}/`).join(
    ' and ',
  )} (${scanned.length} file(s) scanned).`,
);
if (exempt.length > 0) {
  console.log(`Exempt generated token definition: ${exempt.join(', ')}`);
}
if (scanned.some((file) => relative(file) === ROLE_FILE)) {
  console.log(
    'roles.css: primitive aliases allowed only in role definitions; rgb() allowed only in --shadow-* definitions.',
  );
}

if (offenses.length === 0 && !readError) {
  console.log(
    'OK: no disallowed raw hex colours, rgb()/hsl() literals, or --primitive-* references found.',
  );
  process.exit(0);
}

console.log('');
for (const offense of offenses) {
  console.log(
    `${offense.file}:${offense.line}: ${offense.hits.join(
      ', ',
    )} - ${offense.text}`,
  );
}
console.log('');
if (offenses.length > 0) {
  console.error(
    `FAIL: ${offenses.length} offending line(s). Interface code must use role variables only.`,
  );
}
if (readError) {
  console.error('FAIL: one or more files could not be read.');
}
process.exit(1);

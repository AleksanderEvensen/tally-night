#!/usr/bin/env node
/**
 * Syncs the version from package.json into app.json (expo.version).
 * Run after `changeset version` to keep them in sync.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
const appJsonPath = resolve(root, 'app.json');
const appJson = JSON.parse(readFileSync(appJsonPath, 'utf-8'));

appJson.expo.version = pkg.version;

writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
console.log(`Synced app.json version to ${pkg.version}`);

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { detectFormat, parseList } from '../scripts/lib/parse-list.mjs';

const fixture = (name) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

test('detects an adblock list', () => {
  assert.equal(detectFormat(fixture('adblock.txt')), 'adblock');
});

test('detects a hosts list', () => {
  assert.equal(detectFormat(fixture('hosts.txt')), 'hosts');
});

test('detects a domains list', () => {
  assert.equal(detectFormat(fixture('domains.txt')), 'domains');
});

test('detects an HTML page instead of counting it as domains', () => {
  assert.equal(detectFormat(fixture('html.txt')), 'html');
});

test('detects a mixed list by its dominant format', () => {
  assert.equal(detectFormat(fixture('mixed.txt')), 'adblock');
});

test('detects dnsmasq, rpz, and wildcard lists', () => {
  assert.equal(detectFormat(fixture('dnsmasq.txt')), 'dnsmasq');
  assert.equal(detectFormat(fixture('rpz.txt')), 'rpz');
  assert.equal(detectFormat(fixture('wildcard.txt')), 'wildcard');
});

test('counts adblock rules, exceptions, and unique domains', () => {
  const result = parseList(fixture('adblock.txt'));
  assert.equal(result.format, 'adblock');
  assert.equal(result.entries, 2);
  assert.equal(result.rules, 5);
  assert.equal(result.exceptions, 1);
  assert.equal(result.nonDomainRules, 1);
  assert.deepEqual([...result.domains].sort(), [
    'ads.example.com',
    'tracker.example.net',
  ]);
});

test('counts hosts domains and ignores localhost aliases', () => {
  const result = parseList(fixture('hosts.txt'));
  assert.equal(result.format, 'hosts');
  assert.equal(result.entries, 2);
  assert.equal(result.rules, 5);
  assert.equal(result.nonDomainRules, 2);
});

test('counts domains and rejects junk lines', () => {
  const result = parseList(fixture('domains.txt'));
  assert.equal(result.format, 'domains');
  assert.equal(result.entries, 2);
  assert.equal(result.rules, 4);
  assert.equal(result.nonDomainRules, 1);
});

test('an HTML page has no entries', () => {
  const result = parseList(fixture('html.txt'));
  assert.equal(result.format, 'html');
  assert.equal(result.entries, 0);
  assert.equal(result.rules, 0);
});

test('a mixed list counts every recognized domain', () => {
  const result = parseList(fixture('mixed.txt'));
  assert.equal(result.entries, 3);
  assert.equal(result.rules, 3);
});

test('dnsmasq address lines count as domains', () => {
  const result = parseList(fixture('dnsmasq.txt'));
  assert.equal(result.format, 'dnsmasq');
  assert.equal(result.entries, 2);
});

test('rpz records count as domains', () => {
  const result = parseList(fixture('rpz.txt'));
  assert.equal(result.format, 'rpz');
  assert.equal(result.entries, 2);
});

test('wildcard records count as domains', () => {
  const result = parseList(fixture('wildcard.txt'));
  assert.equal(result.format, 'wildcard');
  assert.equal(result.entries, 2);
});

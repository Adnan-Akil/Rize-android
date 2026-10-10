const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..', '..');
const htmlPath = path.join(root, 'app', 'src', 'main', 'assets', 'index.html');
const suitesDir = path.join(root, 'tests', 'e2e', 'test_suites');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 1. Extract test IDs and test names
const suiteFiles = fs.readdirSync(suitesDir).filter(f => f.endsWith('.js'));
const allTests = [];

for (const file of suiteFiles) {
  const fullPath = path.join(suitesDir, file);
  const suite = require(fullPath);
  for (const t of suite.tests) {
    allTests.push({ suite: file, id: t.id, name: t.name, feature: t.feature });
  }
}

console.log(`Total test cases across suites: ${allTests.length}`);

// Check for test ID matches
const matchedIds = allTests.filter(t => htmlContent.includes(t.id));
console.log(`Test IDs found in index.html: ${JSON.stringify(matchedIds.map(t => t.id))}`);

// Check for test name matches
const matchedNames = allTests.filter(t => htmlContent.includes(t.name));
console.log(`Test Names found in index.html: ${JSON.stringify(matchedNames.map(t => t.name))}`);

// 2. Check for environment checks or test runner identifiers
const suspiciousPatterns = [
  'process.env',
  '__test__',
  'isTest',
  'testRunner',
  'mock',
  'global.__',
  'headless',
  'karma',
  'jest',
  'cypress',
  'playwright',
  'puppeteer',
  'mocha'
];

const foundSuspicious = [];
for (const p of suspiciousPatterns) {
  if (htmlContent.includes(p)) {
    foundSuspicious.push(p);
  }
}
console.log(`Suspicious test-env patterns in index.html: ${JSON.stringify(foundSuspicious)}`);

// 3. Check for runner.js or harness.js identifiers
const harnessKeywords = ['loadApp', 'cleanup', 'renderWithEvents', 'createMockNative', 'createMockAudioContext'];
const foundHarness = harnessKeywords.filter(k => htmlContent.includes(k));
console.log(`Harness keywords found in index.html: ${JSON.stringify(foundHarness)}`);

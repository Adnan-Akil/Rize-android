const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..', '..');
const htmlPath = path.join(root, 'app', 'src', 'main', 'assets', 'index.html');
const suitesDir = path.join(root, 'tests', 'e2e', 'test_suites');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Check assertions or test-runner specific tokens
const assertionKeywords = ['assert', 'expect(', 'toBe(', 'toEqual(', 'assert.ok', 'assert.equal', 'assert.strictEqual'];
const foundAssertions = assertionKeywords.filter(k => htmlContent.includes(k));
console.log(`Assertion tokens in index.html: ${JSON.stringify(foundAssertions)}`);

// Check if any assertion failure message from tests exists in index.html
const suiteFiles = fs.readdirSync(suitesDir).filter(f => f.endsWith('.js'));
const assertionMessages = [];

for (const file of suiteFiles) {
  const fullPath = path.join(suitesDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  // Match string literals inside assert calls: assert.ok(..., 'msg')
  const msgMatches = [...content.matchAll(/assert\.[a-zA-Z]+\([^,]+,\s*['"`]([^'"`]+)['"`]\)/g)];
  for (const m of msgMatches) {
    assertionMessages.push(m[1]);
  }
}

console.log(`Extracted assertion messages from suites: ${assertionMessages.length}`);
const matchedMessages = assertionMessages.filter(msg => htmlContent.includes(msg));
console.log(`Assertion messages in index.html: ${JSON.stringify(matchedMessages)}`);

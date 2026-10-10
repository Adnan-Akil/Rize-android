const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..', '..');
const suitesDir = path.join(root, 'tests', 'e2e', 'test_suites');

const suiteFiles = fs.readdirSync(suitesDir).filter(f => f.endsWith('.js'));

console.log('--- Checking Test Suites for Disabled/Weakened Tests ---');
for (const file of suiteFiles) {
  const content = fs.readFileSync(path.join(suitesDir, file), 'utf8');
  const suite = require(path.join(suitesDir, file));
  
  console.log(`Suite ${file}: ${suite.tests.length} tests`);
  
  // Check for suspicious skip or empty tests
  const skipped = content.match(/\.skip|skip:|only:|xit\(|it\.skip/g) || [];
  console.log(`  Skip tokens: ${skipped.length}`);

  // Check for dummy assertions (e.g. assert.ok(true))
  const dummyAsserts = content.match(/assert\.(ok|equal|strictEqual)\(\s*true\s*[,)]/g) || [];
  console.log(`  Dummy true assertions: ${dummyAsserts.length}`);
}

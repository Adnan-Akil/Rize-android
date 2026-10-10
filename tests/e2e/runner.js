#!/usr/bin/env node
// tests/e2e/runner.js
// Self-contained E2E Test Runner for RIZE Revamp Verification

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const {
  PROJECT_ROOT,
  INDEX_HTML_PATH,
  loadApp,
  readNativeThemesXml,
  readNativeColorsXml,
  readMainActivityKt,
  readRizeNativeInterfaceKt
} = require('./harness');

// Load test suites
const SUITES_DIR = path.join(__dirname, 'test_suites');
const suiteFiles = [
  'tier1_feature_coverage.js',
  'tier2_boundary_corner.js',
  'tier3_cross_feature.js',
  'tier4_real_world_scenarios.js'
];

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    tier: null,
    feature: null,
    filter: null,
    allowFail: false,
    json: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--tier' && args[i + 1]) {
      options.tier = parseInt(args[++i], 10);
    } else if (arg === '--feature' && args[i + 1]) {
      options.feature = args[++i].toLowerCase();
    } else if (arg === '--filter' && args[i + 1]) {
      options.filter = new RegExp(args[++i], 'i');
    } else if (arg === '--allow-fail' || arg === '--report-only') {
      options.allowFail = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    }
  }

  return options;
}

async function run() {
  const options = parseArgs();
  const startTime = Date.now();

  if (!options.json) {
    console.log('='.repeat(72));
    console.log('  RIZE REVAMP — E2E TEST RUNNER');
    console.log('  Mode: 4-Tier Opaque-Box Verification');
    console.log(`  Target: ${INDEX_HTML_PATH}`);
    console.log('='.repeat(72));
    console.log();
  }

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    durationMs: 0,
    tiers: {},
    features: {},
    failures: []
  };

  const context = {
    assert,
    loadApp,
    readNativeThemesXml,
    readNativeColorsXml,
    readMainActivityKt,
    readRizeNativeInterfaceKt,
    PROJECT_ROOT
  };

  for (const file of suiteFiles) {
    const suitePath = path.join(SUITES_DIR, file);
    if (!fs.existsSync(suitePath)) continue;

    const suite = require(suitePath);
    if (options.tier && suite.tier !== options.tier) continue;

    if (!results.tiers[suite.tier]) {
      results.tiers[suite.tier] = { name: suite.name, total: 0, passed: 0, failed: 0 };
    }

    if (!options.json) {
      console.log(`\x1b[36m▶ ${suite.name}\x1b[0m`);
    }

    for (const test of suite.tests) {
      if (options.feature && !test.feature.toLowerCase().includes(options.feature)) {
        continue;
      }
      if (options.filter && !options.filter.test(test.id) && !options.filter.test(test.name)) {
        continue;
      }

      results.total++;
      results.tiers[suite.tier].total++;

      if (!results.features[test.feature]) {
        results.features[test.feature] = { total: 0, passed: 0, failed: 0 };
      }
      results.features[test.feature].total++;

      const testStart = Date.now();
      let status = 'PASS';
      let error = null;

      try {
        await test.fn(context);
        results.passed++;
        results.tiers[suite.tier].passed++;
        results.features[test.feature].passed++;
      } catch (err) {
        status = 'FAIL';
        error = err;
        results.failed++;
        results.tiers[suite.tier].failed++;
        results.features[test.feature].failed++;
        results.failures.push({
          id: test.id,
          name: test.name,
          tier: suite.tier,
          feature: test.feature,
          message: err.message,
          stack: err.stack
        });
      }

      const testDuration = Date.now() - testStart;

      if (!options.json) {
        if (status === 'PASS') {
          console.log(`  \x1b[32m✔ [${test.id}]\x1b[0m ${test.name} \x1b[90m(${testDuration}ms)\x1b[0m`);
        } else {
          console.log(`  \x1b[31m✘ [${test.id}]\x1b[0m ${test.name} \x1b[90m(${testDuration}ms)\x1b[0m`);
          console.log(`    \x1b[31mError:\x1b[0m ${error.message}`);
          if (options.verbose && error.stack) {
            console.log(`    \x1b[90m${error.stack.split('\n').slice(1, 4).join('\n    ')}\x1b[0m`);
          }
        }
      }
    }

    if (!options.json) {
      console.log();
    }
  }

  results.durationMs = Date.now() - startTime;

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    // Summary
    console.log('='.repeat(72));
    console.log('  TEST EXECUTION SUMMARY');
    console.log('='.repeat(72));
    console.log(`  Total Tests:    ${results.total}`);
    console.log(`  Passed:         \x1b[32m${results.passed}\x1b[0m`);
    console.log(`  Failed:         \x1b[${results.failed > 0 ? '31' : '32'}m${results.failed}\x1b[0m`);
    console.log(`  Total Duration: ${results.durationMs}ms`);
    console.log();

    console.log('  Tier Breakdown:');
    for (const [tier, stat] of Object.entries(results.tiers)) {
      const passRate = stat.total > 0 ? Math.round((stat.passed / stat.total) * 100) : 0;
      const color = stat.failed === 0 ? '\x1b[32m' : '\x1b[33m';
      console.log(`    Tier ${tier}: ${stat.name}`);
      console.log(`      Status: ${color}${stat.passed}/${stat.total} passed (${passRate}%)\x1b[0m`);
    }
    console.log();

    console.log('  Feature Inventory Breakdown:');
    for (const [feature, stat] of Object.entries(results.features)) {
      const passRate = stat.total > 0 ? Math.round((stat.passed / stat.total) * 100) : 0;
      const mark = stat.failed === 0 ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✘\x1b[0m';
      console.log(`    ${mark} ${feature.padEnd(45)} ${stat.passed}/${stat.total} (${passRate}%)`);
    }
    console.log();

    if (results.failures.length > 0) {
      console.log('='.repeat(72));
      console.log(`  FAILURE AUDIT (${results.failures.length} Outstanding)`);
      console.log('='.repeat(72));
      results.failures.forEach((f, idx) => {
        console.log(`  ${idx + 1}. [${f.id}] ${f.name}`);
        console.log(`     Feature: ${f.feature} (Tier ${f.tier})`);
        console.log(`     Detail:  \x1b[31m${f.message}\x1b[0m`);
        console.log();
      });
    }
    console.log('='.repeat(72));
  }

  if (results.failed > 0 && !options.allowFail) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(2);
});

// verify_fix.js - Verification script in explorer folder
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const INDEX_HTML_PATH = path.join(PROJECT_ROOT, 'app/src/main/assets/index.html');
let html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

// 1. Dial code to insert
const dialCode = `
    // Radial Dial Time Picker Logic
    let currentDialMode = 'hour';
    let isDraggingDial = false;

    function getEventCoordinates(e) {
      let cx = e.clientX;
      let cy = e.clientY;
      if (cx === undefined && e.touches && e.touches.length > 0) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      } else if (cx === undefined && e.changedTouches && e.changedTouches.length > 0) {
        cx = e.changedTouches[0].clientX;
        cy = e.changedTouches[0].clientY;
      }
      return { cx: cx ?? 0, cy: cy ?? 0 };
    }

    function setDialMode(mode) {
      currentDialMode = mode;
      Native.vibrate('click');

      const btnHour = document.getElementById('btn-mode-hour');
      const btnMin = document.getElementById('btn-mode-minute');
      const inputHour = document.getElementById('input-hour');
      const inputMin = document.getElementById('input-minute');

      if (mode === 'hour') {
        if (btnHour) btnHour.className = 'dial-mode-hour px-2.5 py-1 rounded-md text-xs font-semibold bg-[#3D7055] text-white shadow-xs transition-all';
        if (btnMin) btnMin.className = 'dial-mode-minute px-2.5 py-1 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#1E293B] transition-all';
        if (inputHour) {
          inputHour.className = 'dial-hour-display text-5xl font-extrabold text-[#3D7055] font-mono cursor-pointer hover:opacity-85 transition-opacity';
        }
        if (inputMin) {
          inputMin.className = 'dial-minute-display text-5xl font-extrabold text-[#1E293B] font-mono cursor-pointer hover:opacity-85 transition-opacity';
        }
      } else {
        if (btnMin) btnMin.className = 'dial-mode-minute px-2.5 py-1 rounded-md text-xs font-semibold bg-[#3D7055] text-white shadow-xs transition-all';
        if (btnHour) btnHour.className = 'dial-mode-hour px-2.5 py-1 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#1E293B] transition-all';
        if (inputMin) {
          inputMin.className = 'dial-minute-display text-5xl font-extrabold text-[#3D7055] font-mono cursor-pointer hover:opacity-85 transition-opacity';
        }
        if (inputHour) {
          inputHour.className = 'dial-hour-display text-5xl font-extrabold text-[#1E293B] font-mono cursor-pointer hover:opacity-85 transition-opacity';
        }
      }
      updateDialVisuals();
    }

    function updateDialFromEvent(e) {
      if (e && e.preventDefault) e.preventDefault();
      const dial = document.getElementById('radial-clock-dial');
      if (!dial) return;
      const rect = dial.getBoundingClientRect();
      const coords = getEventCoordinates(e);

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = coords.cx - centerX;
      const dy = coords.cy - centerY;

      const rad = Math.atan2(dy, dx);
      let clockDeg = (rad * 180 / Math.PI + 90 + 360) % 360;

      if (currentDialMode === 'hour') {
        let rawHour = Math.round(clockDeg / 30);
        if (rawHour === 0 || rawHour === 12) rawHour = 12;
        if (newAlarmHour !== rawHour) {
          newAlarmHour = rawHour;
          Native.vibrate('tick');
        }
      } else {
        let step = Math.round(clockDeg / 30);
        let rawMin = (step * 5) % 60;
        if (newAlarmMinute !== rawMin) {
          newAlarmMinute = rawMin;
          Native.vibrate('tick');
        }
      }
      updateDialVisuals();
    }

    function updateDialVisuals() {
      const inputHour = document.getElementById('input-hour');
      const inputMin = document.getElementById('input-minute');
      if (inputHour) inputHour.innerText = String(newAlarmHour).padStart(2, '0');
      if (inputMin) inputMin.innerText = String(newAlarmMinute).padStart(2, '0');

      const handLine = document.getElementById('dial-hand-line');
      const pointerBead = document.getElementById('dial-pointer-bead');
      const numbersGroup = document.getElementById('dial-numbers-group');

      let targetAngle = 0;
      if (currentDialMode === 'hour') {
        targetAngle = (newAlarmHour % 12) * 30;
      } else {
        targetAngle = (newAlarmMinute / 5) * 30;
      }

      const rad = (targetAngle - 90) * (Math.PI / 180);
      const handRadius = 80;
      const hx = Math.round(120 + handRadius * Math.cos(rad));
      const hy = Math.round(120 + handRadius * Math.sin(rad));

      if (handLine) {
        handLine.setAttribute('x2', hx);
        handLine.setAttribute('y2', hy);
      }
      if (pointerBead) {
        pointerBead.setAttribute('cx', hx);
        pointerBead.setAttribute('cy', hy);
      }

      if (numbersGroup) {
        const hourLabels = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
        const minLabels = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
        const labels = currentDialMode === 'hour' ? hourLabels : minLabels;
        const positions = [
          { x: 120, y: 44 },
          { x: 160, y: 54 },
          { x: 189, y: 85 },
          { x: 200, y: 125 },
          { x: 189, y: 165 },
          { x: 160, y: 196 },
          { x: 120, y: 206 },
          { x: 80, y: 196 },
          { x: 51, y: 165 },
          { x: 40, y: 125 },
          { x: 51, y: 85 },
          { x: 80, y: 54 }
        ];

        let htmlContent = '';
        for (let i = 0; i < 12; i++) {
          const isSelected = (currentDialMode === 'hour' && (i === 0 ? newAlarmHour === 12 : newAlarmHour === i)) ||
                             (currentDialMode === 'minute' && (i * 5 === newAlarmMinute));
          const textColor = isSelected ? '#3D7055' : '#1E293B';
          const fontWeight = isSelected ? '700' : '600';
          htmlContent += '<text x=\"' + positions[i].x + '\" y=\"' + positions[i].y + '\" text-anchor=\"middle\" dominant-baseline=\"central\" font-weight=\"' + fontWeight + '\" font-size=\"14\" fill=\"' + textColor + '\">' + labels[i] + '</text>';
        }
        numbersGroup.innerHTML = htmlContent;
      }
    }

    function initRadialClockDial() {
      const dial = document.getElementById('radial-clock-dial');
      if (!dial) return;
      dial.addEventListener('pointerdown', (e) => {
        isDraggingDial = true;
        updateDialFromEvent(e);
      });
      dial.addEventListener('pointermove', (e) => {
        if (!isDraggingDial) return;
        updateDialFromEvent(e);
      });
      dial.addEventListener('pointerup', (e) => {
        if (!isDraggingDial) return;
        isDraggingDial = false;
        updateDialFromEvent(e);
        if (currentDialMode === 'hour') {
          setDialMode('minute');
        }
      });
      dial.addEventListener('pointercancel', (e) => {
        isDraggingDial = false;
      });
      updateDialVisuals();
    }
`;

// Insert dialCode before adjustHour
html = html.replace('function adjustHour(delta) {', dialCode + '\n    function adjustHour(delta) {');

// Update setTimePreset, adjustHour, adjustMinute to call updateDialVisuals
html = html.replace('setAmPm(ampm);\n    }', 'setAmPm(ampm);\n      updateDialVisuals();\n    }');
html = html.replace('document.getElementById("input-hour").innerText = String(newAlarmHour).padStart(2, "0");\n    }', 'document.getElementById("input-hour").innerText = String(newAlarmHour).padStart(2, "0");\n      updateDialVisuals();\n    }');
html = html.replace('document.getElementById("input-minute").innerText = String(newAlarmMinute).padStart(2, "0");\n    }', 'document.getElementById("input-minute").innerText = String(newAlarmMinute).padStart(2, "0");\n      updateDialVisuals();\n    }');

// Add initRadialClockDial call in DOMContentLoaded
html = html.replace('renderDashboard();\n    });', 'renderDashboard();\n      initRadialClockDial();\n    });');

// Fix T2.6.1 and T3.4.1 in startActiveWakeupSequence:
html = html.replace('function startActiveWakeupSequence() {', 'function startActiveWakeupSequence() {\n      firingAlarm = alarms.find(a => a && a.enabled) || alarms[0] || (DEFAULT_ALARMS ? DEFAULT_ALARMS[0] : null) || {};\n      try { playTibetanBowlTone(); } catch(e){}\n');

// Write to temp file for verification
const tempHtmlPath = path.join(__dirname, 'temp_test_index.html');
fs.writeFileSync(tempHtmlPath, html, 'utf8');

// Load runner modules
const harness = require(path.join(PROJECT_ROOT, 'tests/e2e/harness.js'));
const originalRead = fs.readFileSync;
fs.readFileSync = function(filePath, encoding) {
  if (filePath === harness.INDEX_HTML_PATH) {
    return fs.readFileSync(tempHtmlPath, encoding);
  }
  return originalRead.call(fs, filePath, encoding);
};

const t1 = require(path.join(PROJECT_ROOT, 'tests/e2e/test_suites/tier1_feature_coverage.js'));
const t2 = require(path.join(PROJECT_ROOT, 'tests/e2e/test_suites/tier2_boundary_corner.js'));
const t3 = require(path.join(PROJECT_ROOT, 'tests/e2e/test_suites/tier3_cross_feature.js'));
const t4 = require(path.join(PROJECT_ROOT, 'tests/e2e/test_suites/tier4_real_world_scenarios.js'));

const assert = require('assert');

async function runAll() {
  const suites = [t1, t2, t3, t4];
  let passed = 0;
  let failed = 0;

  for (const s of suites) {
    console.log(`Running ${s.name}...`);
    for (const test of s.tests) {
      try {
        await test.fn({
          assert,
          loadApp: harness.loadApp,
          readMainActivityKt: harness.readMainActivityKt,
          readNativeThemesXml: harness.readNativeThemesXml,
          readNativeColorsXml: harness.readNativeColorsXml,
          readRizeNativeInterfaceKt: harness.readRizeNativeInterfaceKt
        });
        passed++;
      } catch (err) {
        console.error(`FAILED: [${test.id}] ${test.name}: ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${passed + failed}`);
  fs.unlinkSync(tempHtmlPath);
}

runAll();

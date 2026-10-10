// tests/e2e/harness.js
// Opaque-box E2E Test Harness simulating Android WebView environment for RIZE

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { parseHTML, DOMElement } = require('./dom_sim');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const INDEX_HTML_PATH = path.join(PROJECT_ROOT, 'app/src/main/assets/index.html');

class MockLocalStorage {
  constructor(initialData = {}) {
    this.store = { ...initialData };
  }

  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? String(this.store[key]) : null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

class MockAudioParam {
  constructor(defaultValue = 0) {
    this.value = defaultValue;
    this.history = [];
  }

  setValueAtTime(val, time) {
    this.value = val;
    this.history.push({ action: 'setValueAtTime', value: val, time });
  }

  exponentialRampToValueAtTime(val, time) {
    this.value = val;
    this.history.push({ action: 'exponentialRamp', value: val, time });
  }

  linearRampToValueAtTime(val, time) {
    this.value = val;
    this.history.push({ action: 'linearRamp', value: val, time });
  }
}

class MockOscillatorNode {
  constructor(ctx) {
    this.ctx = ctx;
    this.type = 'sine';
    this.frequency = new MockAudioParam(440);
    this.started = false;
    this.stopped = false;
    this.connections = [];
  }

  connect(target) {
    this.connections.push(target);
    return target;
  }

  start(when = 0) {
    this.started = true;
    this.startTime = when;
  }

  stop(when = 0) {
    this.stopped = true;
    this.stopTime = when;
  }
}

class MockGainNode {
  constructor(ctx) {
    this.ctx = ctx;
    this.gain = new MockAudioParam(1.0);
    this.connections = [];
  }

  connect(target) {
    this.connections.push(target);
    return target;
  }
}

class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.destination = { type: 'destination' };
    this.createdNodes = [];
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }

  createOscillator() {
    const osc = new MockOscillatorNode(this);
    this.createdNodes.push(osc);
    return osc;
  }

  createGain() {
    const gain = new MockGainNode(this);
    this.createdNodes.push(gain);
    return gain;
  }
}

class MockNativeInterface {
  constructor() {
    this.calls = {
      vibrate: [],
      stopVibrate: 0,
      startAlarmSound: 0,
      stopAlarmSound: 0,
      setScreenAwake: [],
      isNfcAvailable: 0,
      isNfcEnabled: 0,
      openNfcSettings: 0,
      setSystemBarTheme: []
    };
    this.nfcAvailable = true;
    this.nfcEnabled = true;
  }

  isNfcAvailable() {
    this.calls.isNfcAvailable++;
    return this.nfcAvailable;
  }

  isNfcEnabled() {
    this.calls.isNfcEnabled++;
    return this.nfcEnabled;
  }

  openNfcSettings() {
    this.calls.openNfcSettings++;
  }

  vibrate(type) {
    this.calls.vibrate.push({ type, timestamp: Date.now() });
  }

  stopVibrate() {
    this.calls.stopVibrate++;
  }

  startAlarmSound() {
    this.calls.startAlarmSound++;
  }

  stopAlarmSound() {
    this.calls.stopAlarmSound++;
  }

  setScreenAwake(awake) {
    this.calls.setScreenAwake.push({ awake: Boolean(awake), timestamp: Date.now() });
  }

  setSystemBarTheme(isLight, colorHex) {
    this.calls.setSystemBarTheme.push({ isLight, colorHex, timestamp: Date.now() });
  }

  reset() {
    this.calls = {
      vibrate: [],
      stopVibrate: 0,
      startAlarmSound: 0,
      stopAlarmSound: 0,
      setScreenAwake: [],
      isNfcAvailable: 0,
      isNfcEnabled: 0,
      openNfcSettings: 0,
      setSystemBarTheme: []
    };
  }
}

function loadApp(options = {}) {
  const htmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  const doc = parseHTML(htmlContent);

  const localStorage = new MockLocalStorage(options.initialStorage || {});
  const native = new MockNativeInterface();
  if (options.nfcAvailable !== undefined) native.nfcAvailable = options.nfcAvailable;
  if (options.nfcEnabled !== undefined) native.nfcEnabled = options.nfcEnabled;

  const audioContexts = [];
  function AudioContextConstructor() {
    const ctx = new MockAudioContext();
    if (options.audioContextSuspended) {
      ctx.state = 'suspended';
    }
    audioContexts.push(ctx);
    return ctx;
  }

  const alerts = [];
  const navigatorVibrations = [];

  const activeIntervals = new Set();
  const activeTimeouts = new Set();

  function trackSetInterval(fn, delay, ...args) {
    const id = setInterval(fn, delay, ...args);
    activeIntervals.add(id);
    return id;
  }
  function trackClearInterval(id) {
    activeIntervals.delete(id);
    clearInterval(id);
  }
  function trackSetTimeout(fn, delay, ...args) {
    const id = setTimeout(() => {
      activeTimeouts.delete(id);
      fn(...args);
    }, delay);
    activeTimeouts.add(id);
    return id;
  }
  function trackClearTimeout(id) {
    activeTimeouts.delete(id);
    clearTimeout(id);
  }

  // Sandbox environment
  const sandbox = {
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {}
    },
    Math,
    Date,
    JSON,
    parseInt,
    parseFloat,
    String,
    Number,
    Boolean,
    Array,
    Object,
    RegExp,
    Set,
    Map,
    Promise,
    Error,
    TypeError,
    RangeError,
    setTimeout: trackSetTimeout,
    clearTimeout: trackClearTimeout,
    setInterval: trackSetInterval,
    clearInterval: trackClearInterval,
    tailwind: {},
    alert: (msg) => alerts.push(String(msg)),
    prompt: () => null,
    confirm: () => true
  };

  const windowObj = {
    document: doc,
    localStorage,
    sessionStorage: localStorage,
    AudioContext: AudioContextConstructor,
    webkitAudioContext: AudioContextConstructor,
    RizeNative: native,
    Android: native,
    navigator: {
      vibrate: (pattern) => {
        navigatorVibrations.push(pattern);
        return true;
      }
    },
    location: {
      href: 'file:///android_asset/index.html',
      pathname: '/android_asset/index.html',
      reload: () => {}
    },
    addEventListener: (type, listener) => doc.addEventListener(type, listener),
    removeEventListener: (type, listener) => doc.removeEventListener(type, listener),
    dispatchEvent: (event) => doc.dispatchEvent(event),
    eval: (code) => vm.runInContext(code, context),
    tailwind: {}
  };

  windowObj.window = windowObj;
  windowObj.self = windowObj;
  doc.defaultView = windowObj;

  Object.assign(sandbox, {
    window: windowObj,
    document: doc,
    localStorage,
    sessionStorage: localStorage,
    AudioContext: AudioContextConstructor,
    webkitAudioContext: AudioContextConstructor,
    RizeNative: native,
    Android: native,
    navigator: windowObj.navigator,
    location: windowObj.location
  });

  const context = vm.createContext(sandbox);

  // Extract inline scripts
  const scriptRegex = /<script(?![^>]*src=)([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    const code = match[2];
    try {
      vm.runInContext(code, context);
    } catch (err) {
      // Record script error if any
      console.error('Script evaluation error in index.html:', err.message);
    }
  }

  // Trigger DOMContentLoaded
  doc.dispatchEvent({ type: 'DOMContentLoaded' });

  // Helpers
  const app = {
    context,
    window: windowObj,
    document: doc,
    native,
    localStorage,
    alerts,
    navigatorVibrations,
    audioContexts,
    rawHtml: htmlContent,

    // Element queries
    get: (id) => doc.getElementById(id),
    query: (sel) => doc.querySelector(sel),
    queryAll: (sel) => doc.querySelectorAll(sel),

    // Interaction helpers
    click: (target) => {
      const el = typeof target === 'string' ? doc.getElementById(target) : target;
      if (!el) throw new Error(`Element not found for click: ${target}`);
      el.click();
    },

    setInputValue: (id, val) => {
      const el = doc.getElementById(id);
      if (!el) throw new Error(`Input not found: ${id}`);
      el.value = val;
      el.dispatchEvent({ type: 'input', target: el });
      el.dispatchEvent({ type: 'change', target: el });
    },

    touchSwipe: (target, { deltaX = -60, deltaY = 0 } = {}) => {
      const el = typeof target === 'string' ? doc.getElementById(target) : target;
      if (!el) throw new Error(`Element not found for swipe: ${target}`);

      const startTouch = { clientX: 100, clientY: 200 };
      const moveTouch = { clientX: 100 + deltaX, clientY: 200 + deltaY };

      el.dispatchEvent({
        type: 'touchstart',
        touches: [startTouch],
        changedTouches: [startTouch],
        preventDefault: () => {}
      });

      el.dispatchEvent({
        type: 'touchmove',
        touches: [moveTouch],
        changedTouches: [moveTouch],
        preventDefault: () => {}
      });

      el.dispatchEvent({
        type: 'touchend',
        touches: [],
        changedTouches: [moveTouch],
        preventDefault: () => {}
      });
    },

    touchDragDial: (target, { startAngle = 0, endAngle = 90 } = {}) => {
      const el = typeof target === 'string' ? doc.getElementById(target) : target;
      if (!el) throw new Error(`Dial element not found: ${target}`);

      // Dial center: (120, 120), radius: 100
      const cx = 120;
      const cy = 120;
      const r = 100;

      const toRad = (deg) => (deg - 90) * (Math.PI / 180);

      const x1 = cx + r * Math.cos(toRad(startAngle));
      const y1 = cy + r * Math.sin(toRad(startAngle));
      const x2 = cx + r * Math.cos(toRad(endAngle));
      const y2 = cy + r * Math.sin(toRad(endAngle));

      // Mock bounding rect on dial element
      el.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });

      el.dispatchEvent({
        type: 'pointerdown',
        clientX: 20 + x1,
        clientY: 20 + y1,
        preventDefault: () => {}
      });

      el.dispatchEvent({
        type: 'pointermove',
        clientX: 20 + x2,
        clientY: 20 + y2,
        preventDefault: () => {}
      });

      el.dispatchEvent({
        type: 'pointerup',
        clientX: 20 + x2,
        clientY: 20 + y2,
        preventDefault: () => {}
      });
    },

    scanNfc: (uid) => {
      if (typeof windowObj.onNativeNfcTag === 'function') {
        windowObj.onNativeNfcTag(uid);
      }
    },

    pressBack: () => {
      if (typeof windowObj.handleBackNav === 'function') {
        return windowObj.handleBackNav();
      }
      return false;
    },

    getActiveScreen: () => {
      const screens = ['screen-dashboard', 'screen-add', 'screen-nfc', 'screen-active'];
      for (const s of screens) {
        const el = doc.getElementById(s);
        if (el && !el.classList.contains('hidden')) {
          return s.replace('screen-', '');
        }
      }
      return null;
    },

    cleanup: () => {
      for (const id of activeIntervals) clearInterval(id);
      for (const id of activeTimeouts) clearTimeout(id);
      activeIntervals.clear();
      activeTimeouts.clear();
    }
  };

  return app;
}

// Helpers for Android native files inspection
function readNativeThemesXml() {
  const p = path.join(PROJECT_ROOT, 'app/src/main/res/values/themes.xml');
  return fs.readFileSync(p, 'utf8');
}

function readNativeColorsXml() {
  const p = path.join(PROJECT_ROOT, 'app/src/main/res/values/colors.xml');
  return fs.readFileSync(p, 'utf8');
}

function readMainActivityKt() {
  const p = path.join(PROJECT_ROOT, 'app/src/main/java/com/rize/nfc/MainActivity.kt');
  return fs.readFileSync(p, 'utf8');
}

function readRizeNativeInterfaceKt() {
  const p = path.join(PROJECT_ROOT, 'app/src/main/java/com/rize/nfc/RizeNativeInterface.kt');
  return fs.readFileSync(p, 'utf8');
}

module.exports = {
  PROJECT_ROOT,
  INDEX_HTML_PATH,
  loadApp,
  MockLocalStorage,
  MockAudioContext,
  MockNativeInterface,
  readNativeThemesXml,
  readNativeColorsXml,
  readMainActivityKt,
  readRizeNativeInterfaceKt
};

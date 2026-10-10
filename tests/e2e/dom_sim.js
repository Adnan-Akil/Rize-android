// tests/e2e/dom_sim.js
// Lightweight, dependency-free DOM & HTML simulator for RIZE E2E tests

class ClassList {
  constructor(element) {
    this.element = element;
  }

  _getClasses() {
    const cls = this.element.attributes['class'] || '';
    return cls.trim().split(/\s+/).filter(Boolean);
  }

  _setClasses(classes) {
    this.element.attributes['class'] = classes.join(' ');
  }

  add(...classNames) {
    const current = new Set(this._getClasses());
    for (const c of classNames) {
      if (c) current.add(c);
    }
    this._setClasses(Array.from(current));
  }

  remove(...classNames) {
    const current = new Set(this._getClasses());
    for (const c of classNames) {
      current.delete(c);
    }
    this._setClasses(Array.from(current));
  }

  contains(className) {
    return this._getClasses().includes(className);
  }

  toggle(className, force) {
    const current = new Set(this._getClasses());
    if (force !== undefined) {
      if (force) current.add(className);
      else current.delete(className);
    } else {
      if (current.has(className)) current.delete(className);
      else current.add(className);
    }
    this._setClasses(Array.from(current));
    return current.has(className);
  }

  get length() {
    return this._getClasses().length;
  }

  toString() {
    return this.element.attributes['class'] || '';
  }
}

class DOMNode {
  constructor() {
    this.parentNode = null;
    this.childNodes = [];
  }

  get firstChild() {
    return this.childNodes[0] || null;
  }

  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] || null;
  }

  appendChild(child) {
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.childNodes.indexOf(child);
    if (idx !== -1) {
      this.childNodes.splice(idx, 1);
      child.parentNode = null;
      return child;
    }
    throw new Error('Node not found in childNodes');
  }

  replaceChild(newChild, oldChild) {
    const idx = this.childNodes.indexOf(oldChild);
    if (idx !== -1) {
      if (newChild.parentNode) {
        newChild.parentNode.removeChild(newChild);
      }
      this.childNodes[idx] = newChild;
      newChild.parentNode = this;
      oldChild.parentNode = null;
      return oldChild;
    }
    throw new Error('oldChild not found in childNodes');
  }

  insertBefore(newNode, refNode) {
    if (!refNode) return this.appendChild(newNode);
    const idx = this.childNodes.indexOf(refNode);
    if (idx === -1) throw new Error('refNode not found in childNodes');
    if (newNode.parentNode) newNode.parentNode.removeChild(newNode);
    this.childNodes.splice(idx, 0, newNode);
    newNode.parentNode = this;
    return newNode;
  }
}

class DOMText extends DOMNode {
  constructor(text) {
    super();
    this.nodeType = 3;
    this.textContent = String(text);
  }

  get nodeValue() {
    return this.textContent;
  }

  set nodeValue(v) {
    this.textContent = String(v);
  }
}

class DOMElement extends DOMNode {
  constructor(tagName, ownerDocument = null) {
    super();
    this.nodeType = 1;
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.attributes = {};
    this.classList = new ClassList(this);
    this.eventListeners = {};
    this.onclick = null;
    this.value = '';
    this.checked = false;
    this._customBoundingRect = null;
    this.style = {};
  }

  get id() {
    return this.attributes['id'] || '';
  }

  set id(val) {
    if (val) this.attributes['id'] = val;
    else delete this.attributes['id'];
  }

  get className() {
    return this.attributes['class'] || '';
  }

  set className(val) {
    if (val !== undefined && val !== null) this.attributes['class'] = String(val);
    else delete this.attributes['class'];
  }

  get children() {
    return this.childNodes.filter(n => n.nodeType === 1);
  }

  getAttribute(name) {
    name = name.toLowerCase();
    return this.attributes[name] !== undefined ? this.attributes[name] : null;
  }

  setAttribute(name, value) {
    name = name.toLowerCase();
    this.attributes[name] = String(value);
    if (name === 'id') this.id = value;
    if (name === 'class') this.className = value;
  }

  removeAttribute(name) {
    delete this.attributes[name.toLowerCase()];
  }

  hasAttribute(name) {
    return this.attributes[name.toLowerCase()] !== undefined;
  }

  get textContent() {
    return this.childNodes.map(n => n.nodeType === 3 ? n.textContent : n.textContent).join('');
  }

  set textContent(val) {
    this.childNodes.forEach(n => n.parentNode = null);
    this.childNodes = [];
    if (val !== '') {
      this.appendChild(new DOMText(val));
    }
  }

  get innerText() {
    return this.textContent;
  }

  set innerText(val) {
    this.textContent = val;
  }

  get innerHTML() {
    return this.childNodes.map(n => {
      if (n.nodeType === 3) return escapeHtml(n.textContent);
      return serializeElement(n);
    }).join('');
  }

  set innerHTML(htmlStr) {
    this.childNodes.forEach(n => n.parentNode = null);
    this.childNodes = [];
    if (htmlStr) {
      const parsedNodes = parseHtmlFragment(htmlStr, this.ownerDocument);
      for (const node of parsedNodes) {
        this.appendChild(node);
      }
    }
  }

  addEventListener(type, listener) {
    if (!this.eventListeners[type]) this.eventListeners[type] = [];
    this.eventListeners[type].push(listener);
  }

  removeEventListener(type, listener) {
    if (this.eventListeners[type]) {
      this.eventListeners[type] = this.eventListeners[type].filter(l => l !== listener);
    }
  }

  dispatchEvent(event) {
    event.target = this;
    event.currentTarget = this;
    const listeners = this.eventListeners[event.type] || [];
    for (const listener of listeners) {
      listener.call(this, event);
    }
    return !event.defaultPrevented;
  }

  click() {
    if (typeof this.onclick === 'function') {
      this.onclick.call(this, { type: 'click', target: this, preventDefault: () => {} });
    } else if (typeof this.onclick === 'string') {
      // Evaluate inline onclick string in window context if attached
      if (this.ownerDocument && this.ownerDocument.defaultView) {
        this.ownerDocument.defaultView.eval(this.onclick);
      }
    }
    this.dispatchEvent({ type: 'click', target: this, preventDefault: () => {} });
  }

  getBoundingClientRect() {
    if (this._customBoundingRect) return this._customBoundingRect;
    return { top: 0, left: 0, right: 360, bottom: 640, width: 360, height: 640, x: 0, y: 0 };
  }

  setBoundingClientRect(rect) {
    this._customBoundingRect = rect;
  }

  querySelector(selector) {
    return querySelectorOne(this, selector);
  }

  querySelectorAll(selector) {
    const results = [];
    querySelectorAllAll(this, selector, results);
    return results;
  }

  getElementById(id) {
    return findById(this, id);
  }
}

class DOMDocument extends DOMNode {
  constructor() {
    super();
    this.nodeType = 9;
    this.defaultView = null;
    this.documentElement = null;
    this.head = null;
    this.body = null;
    this.eventListeners = {};
  }

  createElement(tagName) {
    return new DOMElement(tagName, this);
  }

  createTextNode(text) {
    return new DOMText(text);
  }

  getElementById(id) {
    return findById(this, id);
  }

  querySelector(selector) {
    return querySelectorOne(this, selector);
  }

  querySelectorAll(selector) {
    const results = [];
    querySelectorAllAll(this, selector, results);
    return results;
  }

  addEventListener(type, listener) {
    if (!this.eventListeners[type]) this.eventListeners[type] = [];
    this.eventListeners[type].push(listener);
  }

  removeEventListener(type, listener) {
    if (this.eventListeners[type]) {
      this.eventListeners[type] = this.eventListeners[type].filter(l => l !== listener);
    }
  }

  dispatchEvent(event) {
    const listeners = this.eventListeners[event.type] || [];
    for (const listener of listeners) {
      listener.call(this, event);
    }
  }
}

function findById(node, id) {
  if (node.nodeType === 1 && node.id === id) return node;
  for (const child of node.childNodes) {
    if (child.nodeType === 1) {
      const found = findById(child, id);
      if (found) return found;
    }
  }
  return null;
}

function matchesSelector(el, selector) {
  if (el.nodeType !== 1) return false;
  selector = selector.trim();

  // ID selector #foo
  if (selector.startsWith('#')) {
    return el.id === selector.slice(1);
  }

  // Class selector .foo
  if (selector.startsWith('.')) {
    return el.classList.contains(selector.slice(1));
  }

  // Tag selector div, article, etc.
  if (/^[a-zA-Z0-9_-]+$/.test(selector)) {
    return el.tagName.toLowerCase() === selector.toLowerCase();
  }

  // Attribute selector or tag with attribute: e.g. [attr], tag[attr], tag[attr="val"], tag[attr*="val"]
  const attrMatch = selector.match(/^([a-zA-Z0-9_-]+)?\[([a-zA-Z0-9_-]+)(?:([\*~^$]?=)(['"]?)(.*?)\4)?\]$/);
  if (attrMatch) {
    const tag = attrMatch[1];
    const attrName = attrMatch[2];
    const op = attrMatch[3];
    const attrVal = attrMatch[5];
    if (tag && el.tagName.toLowerCase() !== tag.toLowerCase()) return false;
    const actualVal = el.getAttribute(attrName);
    if (op === undefined) return actualVal !== null;
    if (actualVal === null) return false;
    if (op === '=') return actualVal === attrVal;
    if (op === '*=') return actualVal.includes(attrVal);
    if (op === '^=') return actualVal.startsWith(attrVal);
    if (op === '$=') return actualVal.endsWith(attrVal);
    return false;
  }

  // Composite: tag#id, tag.class, etc.
  const compMatch = selector.match(/^([a-zA-Z0-9_-]+)?(#|\.)([a-zA-Z0-9_-]+)$/);
  if (compMatch) {
    const tag = compMatch[1];
    const type = compMatch[2];
    const val = compMatch[3];
    if (tag && el.tagName.toLowerCase() !== tag.toLowerCase()) return false;
    if (type === '#') return el.id === val;
    if (type === '.') return el.classList.contains(val);
  }

  return false;
}

function querySelectorOne(node, selector) {
  selector = selector.trim();
  const parts = selector.split(/\s+/);

  if (parts.length === 1) {
    return findFirstMatching(node, parts[0]);
  }

  // Descendant selector (e.g. #screen-add button or article.alarm-card)
  const [firstPart, ...rest] = parts;
  const firstMatches = [];
  querySelectorAllAll(node, firstPart, firstMatches);
  const restSelector = rest.join(' ');
  for (const match of firstMatches) {
    const res = querySelectorOne(match, restSelector);
    if (res) return res;
  }
  return null;
}

function findFirstMatching(node, simpleSelector) {
  if (node.nodeType === 1 && matchesSelector(node, simpleSelector)) {
    return node;
  }
  for (const child of node.childNodes) {
    if (child.nodeType === 1) {
      const found = findFirstMatching(child, simpleSelector);
      if (found) return found;
    }
  }
  return null;
}

function querySelectorAllAll(node, selector, results) {
  selector = selector.trim();
  const parts = selector.split(/\s+/);

  if (parts.length === 1) {
    findAllMatching(node, parts[0], results);
    return;
  }

  // Multi-part descendant selector
  const [firstPart, ...rest] = parts;
  const firstMatches = [];
  findAllMatching(node, firstPart, firstMatches);
  const restSelector = rest.join(' ');
  for (const match of firstMatches) {
    querySelectorAllAll(match, restSelector, results);
  }
}

function findAllMatching(node, simpleSelector, results) {
  if (node.nodeType === 1 && matchesSelector(node, simpleSelector)) {
    results.push(node);
  }
  for (const child of node.childNodes) {
    if (child.nodeType === 1) {
      findAllMatching(child, simpleSelector, results);
    }
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function serializeElement(el) {
  const tagName = el.tagName.toLowerCase();
  const attrs = Object.entries(el.attributes)
    .map(([k, v]) => `${k}="${v.replace(/"/g, '&quot;')}"`)
    .join(' ');
  const attrStr = attrs ? ` ${attrs}` : '';
  const voidTags = ['img', 'input', 'br', 'hr', 'meta', 'link'];
  if (voidTags.includes(tagName)) {
    return `<${tagName}${attrStr} />`;
  }
  return `<${tagName}${attrStr}>${el.innerHTML}</${tagName}>`;
}

// Minimal HTML fragment parser for DOM simulation
function parseHtmlFragment(htmlStr, ownerDocument = null) {
  const root = new DOMElement('FRAGMENT_ROOT', ownerDocument);
  const stack = [root];

  // Tokenize HTML tags and text
  const tagRegex = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z0-9:-]+)([^>]*?)(\/)?>|([^<]+)/g;
  let match;

  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', 'circle', 'line', 'path', 'rect', 'polygon']);

  while ((match = tagRegex.exec(htmlStr)) !== null) {
    const [fullMatch, isClosing, tagName, attrString, isSelfClosing, textContent] = match;

    if (fullMatch.startsWith('<!--')) {
      // Comment - ignore
      continue;
    }

    if (textContent !== undefined) {
      const currentParent = stack[stack.length - 1];
      currentParent.appendChild(new DOMText(textContent));
      continue;
    }

    if (tagName) {
      const tagLower = tagName.toLowerCase();
      if (isClosing) {
        // Pop stack until matching tag or root
        for (let i = stack.length - 1; i > 0; i--) {
          if (stack[i].tagName.toLowerCase() === tagLower) {
            stack.splice(i);
            break;
          }
        }
      } else {
        const el = new DOMElement(tagName, ownerDocument);
        parseAttributes(attrString || '', el);

        const currentParent = stack[stack.length - 1];
        currentParent.appendChild(el);

        const isVoid = isSelfClosing || voidTags.has(tagLower);
        if (!isVoid) {
          stack.push(el);
        }
      }
    }
  }

  return [...root.childNodes];
}

function parseAttributes(attrStr, element) {
  const attrRegex = /([a-zA-Z0-9:-]+)(?:\s*=\s*(?:'([^']*)'|"([^"]*)"|([^\s>]+)))?/g;
  let match;
  while ((match = attrRegex.exec(attrStr)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2] !== undefined ? match[2] : match[3] !== undefined ? match[3] : match[4] !== undefined ? match[4] : '';
    element.setAttribute(name, value);
    if (name.startsWith('on')) {
      element[name] = value;
    }
  }
}

// Parse a full HTML document
function parseHTML(htmlString) {
  const doc = new DOMDocument();
  const htmlNode = new DOMElement('HTML', doc);
  const headNode = new DOMElement('HEAD', doc);
  const bodyNode = new DOMElement('BODY', doc);

  doc.documentElement = htmlNode;
  doc.head = headNode;
  doc.body = bodyNode;

  doc.appendChild(htmlNode);
  htmlNode.appendChild(headNode);
  htmlNode.appendChild(bodyNode);

  // Extract <html class="..."> attributes if any
  const htmlTagMatch = htmlString.match(/<html([^>]*)>/i);
  if (htmlTagMatch && htmlTagMatch[1]) {
    parseAttributes(htmlTagMatch[1], htmlNode);
  }

  // Extract head contents and body contents
  const headMatch = htmlString.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (headMatch && headMatch[1]) {
    const headChildren = [...parseHtmlFragment(headMatch[1], doc)];
    for (const c of headChildren) headNode.appendChild(c);
  }

  // Extract body attributes & content
  const bodyTagMatch = htmlString.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
  if (bodyTagMatch) {
    if (bodyTagMatch[1]) parseAttributes(bodyTagMatch[1], bodyNode);
    if (bodyTagMatch[2]) {
      const bodyChildren = [...parseHtmlFragment(bodyTagMatch[2], doc)];
      for (const c of bodyChildren) bodyNode.appendChild(c);
    }
  } else {
    // If no explicit body tag, parse entire string into body
    const bodyChildren = [...parseHtmlFragment(htmlString, doc)];
    for (const c of bodyChildren) bodyNode.appendChild(c);
  }

  return doc;
}

module.exports = {
  DOMNode,
  DOMText,
  DOMElement,
  DOMDocument,
  ClassList,
  parseHTML,
  parseHtmlFragment
};

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

class FakeClassList {
  values = new Set<string>();
  add(value: string) { this.values.add(value); }
  remove(value: string) { this.values.delete(value); }
  contains(value: string) { return this.values.has(value); }
}

class FakeElement {
  dataset: Record<string, string> = {};
  classList = new FakeClassList();
  attributes = new Map<string, string>();
  listeners = new Map<string, Array<(event: any) => void>>();
  icon?: { className: string };
  focused = false;
  hidden = false;

  addEventListener(type: string, listener: (event: any) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) || []), listener]);
  }
  click(target: any = this) {
    for (const listener of this.listeners.get("click") || []) listener({ target, preventDefault() {} });
  }
  focus() { this.focused = true; }
  querySelector(selector: string): any { return selector === "i" ? this.icon || null : null; }
  querySelectorAll() { return []; }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  remove() { this.attributes.set("removed", "true"); }
}

test("site behavior initializes after DOMContentLoaded and keeps theme/dialog controls working", async () => {
  const themeButton = new FakeElement();
  themeButton.icon = { className: "bi bi-moon-stars" };
  const closeButton = new FakeElement();
  const playButton = new FakeElement();
  const continueButton = new FakeElement();
  const celebration = new FakeElement();
  celebration.querySelector = (selector: string) => ({
    "[data-success-close]": closeButton,
    "[data-play-success]": playButton,
    "[data-success-continue]": continueButton,
  }[selector] || null);

  let audioPlayCount = 0;
  const audio = {
    currentTime: 0,
    pause() {},
    play() { audioPlayCount += 1; return Promise.resolve(); },
  };
  const documentListeners = new Map<string, Array<(event: any) => void>>();
  const timers: Array<{ callback: () => void; delay: number }> = [];
  const documentElement = new FakeElement();
  const body = new FakeElement();
  const document = {
    readyState: "complete",
    documentElement,
    body,
    querySelectorAll(selector: string) { return selector === ".theme-toggle" ? [themeButton] : []; },
    querySelector(selector: string) { return selector === "[data-success-celebration]" ? celebration : null; },
    getElementById(id: string) { return id === "contactSuccessAudio" ? audio : null; },
    addEventListener(type: string, listener: (event: any) => void) { documentListeners.set(type, [...(documentListeners.get(type) || []), listener]); },
    removeEventListener(type: string, listener: (event: any) => void) { documentListeners.set(type, (documentListeners.get(type) || []).filter((item) => item !== listener)); },
    title: "Portfolio",
  };
  const localValues = new Map<string, string>();
  const window = {
    matchMedia: () => ({ matches: false }),
    innerWidth: 1280,
    screen: { width: 1440, height: 900 },
    setTimeout(callback: () => void, delay: number) { timers.push({ callback, delay }); return timers.length; },
    clearTimeout() {},
    gsap: undefined,
    ScrollTrigger: undefined,
    history: undefined,
    URLSearchParams: undefined,
  };

  vm.runInNewContext(readFileSync("public/static/js/site.js", "utf8"), {
    document,
    window,
    localStorage: { getItem: (key: string) => localValues.get(key) || null, setItem: (key: string, value: string) => localValues.set(key, value) },
    sessionStorage: { getItem: () => null, setItem() {} },
    navigator: { platform: "Windows", language: "en" },
    Intl,
    URL,
  });

  assert.equal(documentElement.dataset.theme, "dark");
  themeButton.click();
  assert.equal(documentElement.dataset.theme, "light");
  assert.equal(localValues.get("portfolio-theme"), "light");
  assert.equal(closeButton.focused, true);
  assert.equal(body.classList.contains("success-dialog-open"), true);

  timers.find((timer) => timer.delay === 240)?.callback();
  await Promise.resolve();
  assert.equal(audioPlayCount, 1);

  for (const listener of documentListeners.get("keydown") || []) listener({ key: "Escape" });
  assert.equal(celebration.classList.contains("is-leaving"), true);
  assert.equal(body.classList.contains("success-dialog-open"), false);
});

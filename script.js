/* Theme 1 — sequential archive */

(function () {
  const CHAIN = ["case-01", "case-02", "case-03", "case-04", "case-05", "case-06", "file-07"];
  const START = ["file-00", "case-01"];
  const STORAGE_KEY = "cci-theme1-unlocks";
  const LANG_KEY = "cci-lang";
  const DECRYPTED = {
    en: "> [ DECRYPTED ]",
    ar: "> [ تم فك التشفير ]"
  };

  const LABELS = {
    "file-00": "FILE 00",
    "case-01": "CASE 01",
    "case-02": "CASE 02",
    "case-03": "CASE 03",
    "case-04": "CASE 04",
    "case-05": "CASE 05",
    "case-06": "CASE 06",
    "file-07": "FILE 07"
  };

  const TITLES = {
    "file-00": "PERSONNEL CLEARANCE & ROSTER",
    "case-01": "THE STAIRWELL ANOMALY",
    "case-02": "THE KINGSLEY WAREHOUSE",
    "case-03": "THE STERLING COLLAPSE",
    "case-04": "THE PATTERN",
    "case-05": "THE DIGITAL SHADOW",
    "case-06": "THE GHOST IN THE MACHINE",
    "file-07": "RESTRICTED ACCESS"
  };

  const KNOWN = new Set(Object.keys(LABELS));

  const desktop = document.getElementById("desktop");
  const modal = document.getElementById("modal");
  const modalWindow = document.getElementById("modal-window");
  const scroller = document.getElementById("modal-body");
  const closeBtn = document.getElementById("close-file");
  const readStatus = document.getElementById("read-status");
  const toastEl = document.getElementById("toast");
  const clockEl = document.getElementById("clock");
  const countEl = document.getElementById("clearance-count");
  const sequenceEl = document.getElementById("sequence-label");
  const langToggle = document.getElementById("lang-toggle");
  const langCode = document.getElementById("lang-code");
  const bottombar = document.getElementById("bottombar");
  const folders = Array.from(document.querySelectorAll(".folder"));
  const panels = Array.from(document.querySelectorAll(".file-panel"));
  const pips = Array.from(document.querySelectorAll(".pip"));

  const state = {
    unlocked: new Set(START),
    openId: null,
    readComplete: false,
    lastFocus: null,
    lang: "en"
  };

  let toastTimer = 0;
  let typeTimer = 0;
  let audioCtx = null;
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function soundEngine() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function playClick() {
    const ctx = soundEngine();
    if (!ctx) return;
    const t = ctx.currentTime;
    const length = Math.max(1, Math.floor(ctx.sampleRate * 0.018));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 10);
    }
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    noise.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = 2200;
    gain.gain.setValueAtTime(0.2, t);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
    noise.stop(t + 0.02);
  }

  function playDecrypt() {
    const ctx = soundEngine();
    if (!ctx) return;
    const t = ctx.currentTime;
    const ticks = 12;
    for (let i = 0; i < ticks; i += 1) {
      const offset = i * 0.026;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i % 2 === 0 ? "square" : "triangle";
      osc.frequency.setValueAtTime(1460 + ((i * 430) % 1680), t + offset);
      gain.gain.setValueAtTime(0.0001, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.028, t + offset + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.016);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.018);
    }
  }

  function playGrant() {
    const ctx = soundEngine();
    if (!ctx) return;
    const t = ctx.currentTime;
    [0, 0.09].forEach(function (offset, index) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(index === 0 ? 740 : 1180, t + offset);
      gain.gain.setValueAtTime(0.0001, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.06, t + offset + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.08);
    });
  }

  const bannerCopy = new Map();
  let typingFields = null;

  function bannerFields(id) {
    if (bannerCopy.has(id)) return bannerCopy.get(id);
    const panel = panels.find(function (item) { return item.dataset.file === id; });
    const banner = panel.querySelector(".file-banner");
    const lines = Array.from(banner.children).filter(function (el) {
      return el.textContent.trim();
    }).map(function (el) {
      return { el: el, text: el.textContent };
    });
    const saved = { lines: lines };
    bannerCopy.set(id, saved);
    return saved;
  }

  function restoreBanner(fields) {
    fields.lines.forEach(function (line) {
      line.el.textContent = line.text;
      line.el.classList.remove("is-typing");
    });
  }

  function stopTyping() {
    window.clearInterval(typeTimer);
    if (typingFields) restoreBanner(typingFields);
    typingFields = null;
  }

  function typeHeader(id) {
    stopTyping();
    const fields = bannerFields(id);
    modalWindow.setAttribute("aria-label", fields.lines.map(function (line) {
      return line.text;
    }).join(" "));
    if (motionQuery.matches) {
      restoreBanner(fields);
      return;
    }
    typingFields = fields;
    fields.lines.forEach(function (line) {
      line.el.textContent = "";
      line.el.classList.remove("is-typing");
    });
    let lineIndex = 0;
    let charIndex = 0;
    fields.lines[0].el.classList.add("is-typing");
    typeTimer = window.setInterval(function () {
      const line = fields.lines[lineIndex];
      charIndex += 1;
      line.el.textContent = line.text.slice(0, charIndex);
      if (charIndex < line.text.length) return;
      line.el.classList.remove("is-typing");
      lineIndex += 1;
      charIndex = 0;
      if (lineIndex >= fields.lines.length) {
        stopTyping();
        return;
      }
      fields.lines[lineIndex].el.classList.add("is-typing");
    }, 80);
  }

  function writeCopy(el, value) {
    const who = el.querySelector(":scope > .who");
    if (who) {
      let node = who.nextSibling;
      while (node) {
        const next = node.nextSibling;
        if (node.nodeType === Node.TEXT_NODE) node.remove();
        node = next;
      }
      who.after(document.createTextNode(value ? " " + value : ""));
      return;
    }
    if (el.children.length) return;
    el.textContent = value;
  }

  function applyLanguage(lang) {
    window.clearInterval(typeTimer);
    if (typingFields) restoreBanner(typingFields);
    typingFields = null;
    bannerCopy.clear();
    state.lang = lang === "ar" ? "ar" : "en";
    const rtl = state.lang === "ar";
    document.querySelectorAll("[data-en]").forEach(function (el) {
      const expanded = el.classList.contains("preview-chat") && el.getAttribute("aria-expanded") === "true";
      const value = expanded ? DECRYPTED[state.lang] : el.getAttribute(rtl ? "data-ar" : "data-en");
      writeCopy(el, value);
      el.dir = rtl ? "rtl" : "ltr";
      el.lang = state.lang;
    });
    document.querySelectorAll(".narrative, .note, .chat-log, .transcript, .raw-feed, .recovered-note").forEach(function (block) {
      if (!block.querySelector("[data-en]")) return;
      block.dir = rtl ? "rtl" : "ltr";
      block.lang = state.lang;
    });
    try {
      sessionStorage.setItem(LANG_KEY, state.lang);
    } catch (err) {
      /* private browsing can block storage */
    }
    if (langToggle && langCode) {
      langCode.textContent = rtl ? "EN" : "AR";
      langToggle.setAttribute("aria-label", rtl ? "Switch to English" : "Switch to Arabic");
      langToggle.setAttribute("aria-pressed", rtl ? "true" : "false");
    }
    document.documentElement.lang = state.lang;
    if (state.openId) typeHeader(state.openId);
  }

  function placeModalOrigin(folder) {
    const folderBox = folder.getBoundingClientRect();
    const anchorX = folderBox.left + folderBox.width / 2;
    const anchorY = folderBox.top + folderBox.height / 2;
    modal.classList.remove("is-open");
    modal.hidden = false;
    const win = modalWindow.getBoundingClientRect();
    const originX = anchorX - win.left;
    const originY = anchorY - win.top;
    const widthScale = folderBox.width / Math.max(win.width, 1);
    const heightScale = folderBox.height / Math.max(win.height, 1);
    const enter = Math.min(0.46, Math.max(0.14, Math.min(widthScale, heightScale)));
    modal.style.setProperty("--origin-x", originX + "px");
    modal.style.setProperty("--origin-y", originY + "px");
    modal.style.setProperty("--enter-scale", String(enter));
    void modalWindow.offsetWidth;
    modal.classList.add("is-open");
  }

  function bindTilt(card) {
    card.addEventListener("pointermove", function (event) {
      if (motionQuery.matches) return;
      const box = card.getBoundingClientRect();
      const px = (event.clientX - box.left) / box.width - 0.5;
      const py = (event.clientY - box.top) / box.height - 0.5;
      const rotY = px * 9;
      const rotX = py * -7;
      card.style.transform = "perspective(800px) rotateX(" + rotX.toFixed(2) + "deg) rotateY(" + rotY.toFixed(2) + "deg) translateY(-3px)";
    });
    card.addEventListener("pointerleave", function () {
      card.style.transform = "";
    });
  }

  function loadUnlocks() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const ids = JSON.parse(raw);
      if (!Array.isArray(ids)) return;
      ids.forEach(function (id) {
        if (KNOWN.has(id)) state.unlocked.add(id);
      });
    } catch (err) {
      /* keep the default clearance */
    }
    START.forEach(function (id) { state.unlocked.add(id); });
  }

  function persist() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(state.unlocked)));
  }

  function currentFrontier() {
    let frontier = "case-01";
    CHAIN.forEach(function (id) {
      if (state.unlocked.has(id)) frontier = id;
    });
    return frontier;
  }

  function nextInChain(id) {
    const index = CHAIN.indexOf(id);
    if (index < 0 || index >= CHAIN.length - 1) return null;
    return CHAIN[index + 1];
  }

  function render(justUnlocked) {
    folders.forEach(function (btn) {
      const id = btn.dataset.file;
      const open = state.unlocked.has(id);
      const wasLocked = btn.classList.contains("locked");
      btn.classList.toggle("unlocked", open);
      btn.classList.toggle("locked", !open);
      btn.disabled = !open;
      const stateLabel = btn.querySelector(".folder-state");
      if (stateLabel) stateLabel.textContent = open ? "ACCESS GRANTED" : "RESTRICTED";
      btn.setAttribute("aria-disabled", open ? "false" : "true");
      const sub = btn.querySelector(".folder-sub");
      btn.setAttribute(
        "aria-label",
        LABELS[id] + (sub ? ", " + sub.textContent : "") + (open ? ", unlocked" : ", locked")
      );
      if (open && wasLocked && id === justUnlocked) {
        btn.classList.remove("just-unlocked");
        void btn.offsetWidth;
        btn.classList.add("just-unlocked");
        btn.addEventListener("animationend", function done() {
          btn.classList.remove("just-unlocked");
          btn.removeEventListener("animationend", done);
        });
      }
    });

    pips.forEach(function (pip) {
      pip.classList.toggle("on", state.unlocked.has(pip.dataset.file));
    });

    countEl.textContent = String(state.unlocked.size).padStart(2, "0") + " / 08";
    const frontier = currentFrontier();
    const upcoming = nextInChain(frontier);
    if (!upcoming) {
      sequenceEl.textContent = "ALL FILES RELEASED // FILE 07 IS OPEN";
      bottombar.classList.add("all-clear");
    } else {
      sequenceEl.textContent = "NEXT LOCK: " + LABELS[upcoming] + " — CLOSE " + LABELS[frontier] + " AT END OF FILE";
      bottombar.classList.remove("all-clear");
    }
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("show");
    }, 3400);
  }

  function tick() {
    clockEl.textContent = new Date().toLocaleString("en-GB", { hour12: false });
  }

  function updateReadStatus() {
    if (!state.openId) return;
    if (!state.readComplete) {
      readStatus.textContent = "SCROLL TO END OF FILE TO LOG READ";
      readStatus.classList.remove("done");
      return;
    }
    readStatus.classList.add("done");
    if (state.openId === "file-00") {
      readStatus.textContent = "READ LOGGED // ADMINISTRATIVE FILE";
      return;
    }
    if (state.openId === "file-07") {
      readStatus.textContent = "READ LOGGED // END OF ARCHIVE";
      return;
    }
    const frontier = currentFrontier();
    const upcoming = nextInChain(state.openId);
    if (state.openId === frontier && upcoming && !state.unlocked.has(upcoming)) {
      readStatus.textContent = "READ LOGGED // CLOSE TO UNLOCK " + LABELS[upcoming];
      return;
    }
    readStatus.textContent = "READ LOGGED // FILE ALREADY IN ARCHIVE";
  }

  function resetFinale() {
    modalWindow.classList.remove("blackout");
    document.body.classList.remove("archive-melt");
  }

  function openFile(id, folder) {
    if (!state.unlocked.has(id)) return;
    state.openId = id;
    state.readComplete = false;
    state.lastFocus = document.activeElement;
    resetFinale();
    panels.forEach(function (panel) {
      panel.hidden = panel.dataset.file !== id;
    });
    updateReadStatus();
    playClick();
    if (folder) placeModalOrigin(folder);
    else {
      modal.hidden = false;
      modal.classList.add("is-open");
    }
    typeHeader(id);
    document.body.classList.add("modal-open");
    desktop.inert = true;
    document.title = LABELS[id] + " // COLD CASE INITIATIVE";
    scroller.scrollTop = 0;
    closeBtn.focus({ preventScroll: true });
    window.requestAnimationFrame(function () {
      scroller.scrollTop = 0;
      if (sentinelInView()) state.readComplete = true;
      updateReadStatus();
    });
  }

  function sentinelInView() {
    const panel = panels.find(function (item) { return item.dataset.file === state.openId; });
    if (!panel) return false;
    const sentinel = panel.querySelector(".eof-sentinel");
    if (!sentinel) return false;
    const box = scroller.getBoundingClientRect();
    const mark = sentinel.getBoundingClientRect();
    const overflow = scroller.scrollHeight - scroller.clientHeight;
    if (overflow <= 8) return true;
    return mark.top < box.bottom - 12 && mark.bottom > box.top + 12;
  }

  function dismiss() {
    stopTyping();
    modal.classList.remove("is-open");
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    desktop.inert = false;
    resetFinale();
    document.title = "CCI // COLD CASE INITIATIVE";
    const returnTo = state.lastFocus;
    state.openId = null;
    state.readComplete = false;
    if (returnTo && typeof returnTo.focus === "function") returnTo.focus();
  }

  function closeFile() {
    if (!state.openId) return;
    const id = state.openId;
    const finished = state.readComplete;
    const frontier = currentFrontier();
    const upcoming = nextInChain(id);
    dismiss();

    if (finished && id === frontier && upcoming && !state.unlocked.has(upcoming)) {
      state.unlocked.add(upcoming);
      persist();
      render(upcoming);
      playGrant();
      showToast("ACCESS GRANTED // " + LABELS[upcoming]);
      return;
    }

    if (!finished && id === frontier && upcoming) {
      showToast("SEQUENCE HOLD // SCROLL TO THE END, THEN CLOSE");
    }
  }

  folders.forEach(function (btn) {
    bindTilt(btn);
    btn.addEventListener("click", function () {
      openFile(btn.dataset.file, btn);
    });
  });

  closeBtn.addEventListener("click", closeFile);

  document.addEventListener("keydown", function (event) {
    if (modal.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeFile();
      return;
    }
    if (event.key !== "Tab") return;
    const focusables = Array.from(modalWindow.querySelectorAll("button, [href], [tabindex]:not([tabindex='-1'])")).filter(function (el) {
      return !el.disabled && el.offsetParent !== null;
    });
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  scroller.addEventListener("scroll", function () {
    if (!state.openId) return;
    const overflow = scroller.scrollHeight - scroller.clientHeight;
    if (overflow > 8 && scroller.scrollTop >= overflow - 6) {
      state.readComplete = true;
      updateReadStatus();
    }
  }, { passive: true });

  const sentinelObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      const panel = entry.target.closest(".file-panel");
      if (!panel || panel.dataset.file !== state.openId) return;
      if (entry.isIntersecting) state.readComplete = true;
      else if (scroller.scrollTop < 24) state.readComplete = false;
      updateReadStatus();
    });
  }, { root: scroller, threshold: 0.6 });

  document.querySelectorAll(".eof-sentinel").forEach(function (node) {
    sentinelObserver.observe(node);
  });

  const rawFeed = document.getElementById("raw-feed");
  if (rawFeed) {
    const rawObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && state.openId === "file-07") {
          modalWindow.classList.add("blackout");
          document.body.classList.add("archive-melt");
        }
      });
    }, { root: scroller, threshold: 0.2 });
    rawObserver.observe(rawFeed);
  }

  scroller.addEventListener("click", function (event) {
    const button = event.target.closest(".preview-chat");
    if (!button || button.getAttribute("aria-expanded") === "true") return;
    playDecrypt();
    const log = button.parentElement.querySelector(".chat-body");
    const inner = log.querySelector(".chat-inner");
    button.setAttribute("aria-expanded", "true");
    button.disabled = true;
    button.textContent = DECRYPTED[state.lang];
    inner.inert = false;
    inner.setAttribute("aria-hidden", "false");
    log.classList.add("open");
  });

  document.querySelectorAll(".evidence img").forEach(function (img) {
    img.addEventListener("load", function () {
      if (!state.openId) return;
      const overflow = scroller.scrollHeight - scroller.clientHeight;
      const atEnd = overflow <= 8 || scroller.scrollTop >= overflow - 8;
      state.readComplete = atEnd;
      updateReadStatus();
    });
  });

  loadUnlocks();
  render(null);
  if (langToggle) {
    langToggle.addEventListener("click", function () {
      applyLanguage(state.lang === "ar" ? "en" : "ar");
    });
  }
  let savedLang = "en";
  try {
    savedLang = sessionStorage.getItem(LANG_KEY) === "ar" ? "ar" : "en";
  } catch (err) {
    savedLang = "en";
  }
  applyLanguage(savedLang);
  tick();
  window.setInterval(tick, 1000);
})();

(() => {
  const SECRET = ["up", "up", "down", "down", "left", "left", "right", "right"];
  const buffer = [];
  let touchStartX = 0;
  let touchStartY = 0;
  let menu = null;

  const normalizeKey = (key) => {
    if (key === "ArrowUp") return "up";
    if (key === "ArrowDown") return "down";
    if (key === "ArrowLeft") return "left";
    if (key === "ArrowRight") return "right";
    return null;
  };

  const sequenceMatches = () => SECRET.every((dir, index) => buffer[index] === dir);

  const pushDirection = (direction) => {
    if (!direction) return;
    buffer.push(direction);
    while (buffer.length > SECRET.length) buffer.shift();
    if (buffer.length === SECRET.length && sequenceMatches()) {
      buffer.length = 0;
      openMenu();
    }
  };

  const getLevelCount = () => {
    const count = Number(window.__ASCENSION_LEVEL_COUNT || 0);
    return Number.isFinite(count) && count > 0 ? count : 20;
  };

  const closeMenu = () => {
    if (menu) {
      menu.remove();
      menu = null;
    }
  };

  const jumpToLevel = (levelNumber) => {
    if (typeof window.__ASCENSION_QA_GO_TO_LEVEL === "function") {
      window.__ASCENSION_QA_GO_TO_LEVEL(levelNumber);
      closeMenu();
    }
  };

  function openMenu() {
    closeMenu();

    menu = document.createElement("div");
    menu.id = "qa-level-select-menu";
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-label", "Secret QA Level Select");
    menu.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:999999",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:18px",
      "background:rgba(15,23,42,0.52)",
      "backdrop-filter:blur(10px)",
      "-webkit-backdrop-filter:blur(10px)",
      "font-family:Montserrat,system-ui,sans-serif"
    ].join(";");

    const panel = document.createElement("div");
    panel.style.cssText = [
      "width:min(92vw,520px)",
      "max-height:82vh",
      "overflow:auto",
      "border-radius:28px",
      "background:rgba(255,255,255,0.92)",
      "box-shadow:0 24px 70px rgba(15,23,42,0.35)",
      "border:1px solid rgba(255,255,255,0.65)",
      "padding:20px",
      "color:#334155"
    ].join(";");

    const top = document.createElement("div");
    top.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;";

    const title = document.createElement("div");
    title.innerHTML = '<div style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;opacity:.55;">QA Debug</div><div style="font-size:22px;font-weight:300;letter-spacing:.08em;">Level Select</div>';

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Close";
    close.setAttribute("aria-label", "Close level select");
    close.style.cssText = "border:0;border-radius:999px;background:#334155;color:white;padding:10px 16px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;";
    close.addEventListener("click", closeMenu);

    top.appendChild(title);
    top.appendChild(close);

    const grid = document.createElement("div");
    grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(92px,1fr));gap:10px;";

    const count = getLevelCount();
    for (let i = 1; i <= count; i += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `Level ${i}`;
      button.style.cssText = [
        "border:0",
        "border-radius:18px",
        "background:#fb7185",
        "color:white",
        "padding:14px 10px",
        "font-size:13px",
        "letter-spacing:.08em",
        "box-shadow:0 8px 20px rgba(251,113,133,.25)",
        "touch-action:manipulation"
      ].join(";");
      button.addEventListener("click", () => jumpToLevel(i));
      grid.appendChild(button);
    }

    panel.appendChild(top);
    panel.appendChild(grid);
    menu.appendChild(panel);
    menu.addEventListener("click", (event) => {
      if (event.target === menu) closeMenu();
    });
    document.body.appendChild(menu);
  }

  window.addEventListener("keydown", (event) => {
    const direction = normalizeKey(event.key);
    if (direction) pushDirection(direction);
    if (event.key === "Escape") closeMenu();
  }, { passive: true });

  window.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch) return;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  window.addEventListener("touchend", (event) => {
    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const threshold = 38;

    if (Math.max(absX, absY) < threshold) return;
    if (absY > absX) {
      pushDirection(dy < 0 ? "up" : "down");
    } else {
      pushDirection(dx < 0 ? "left" : "right");
    }
  }, { passive: true });
})();

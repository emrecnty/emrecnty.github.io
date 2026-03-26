(() => {
  class NostalgiaTouchEngine {
    constructor(options = {}) {
      this.target = options.target || document.body;
      this.debug = !!options.debug;

      this.keys = {
        up: options.keys?.up || "ArrowUp",
        down: options.keys?.down || "ArrowDown",
        left: options.keys?.left || "ArrowLeft",
        right: options.keys?.right || "ArrowRight",
      };

      this.state = {
        up: false,
        down: false,
        left: false,
        right: false,
      };

      this.activeTouches = new Map();
      this.dpadTouchId = null;

      this.zone = null;
      this.zoneRect = null;

      this.deadZoneRatio = options.deadZoneRatio ?? 0.18;
      this.boundResize = this.updateZoneRect.bind(this);
    }

    init() {
      this.createDpadZone();
      this.attachEvents();
      this.updateZoneRect();
      window.addEventListener("resize", this.boundResize, { passive: true });
      window.addEventListener("orientationchange", this.boundResize, { passive: true });
    }

    destroy() {
      window.removeEventListener("resize", this.boundResize);
      window.removeEventListener("orientationchange", this.boundResize);
      this.releaseAllDirections();
      this.zone?.remove();
    }

    createDpadZone() {
      const zone = document.createElement("div");
      zone.className = "nostalgia-dpad-zone";
      zone.setAttribute("aria-hidden", "true");
      this.target.appendChild(zone);
      this.zone = zone;
    }

    updateZoneRect() {
      if (!this.zone) return;
      this.zoneRect = this.zone.getBoundingClientRect();
    }

    attachEvents() {
      this.zone.addEventListener("touchstart", (e) => this.onTouchStart(e), { passive: false });
      this.zone.addEventListener("touchmove", (e) => this.onTouchMove(e), { passive: false });
      this.zone.addEventListener("touchend", (e) => this.onTouchEnd(e), { passive: false });
      this.zone.addEventListener("touchcancel", (e) => this.onTouchEnd(e), { passive: false });
    }

    onTouchStart(e) {
      if (this.dpadTouchId !== null) return;

      const touch = this.findTouchInsideZone(e.changedTouches);
      if (!touch) return;

      e.preventDefault();
      this.dpadTouchId = touch.identifier;
      this.updateFromTouch(touch.clientX, touch.clientY);
    }

    onTouchMove(e) {
      if (this.dpadTouchId === null) return;

      const touch = this.findTouchById(e.changedTouches, this.dpadTouchId);
      if (!touch) return;

      e.preventDefault();
      this.updateFromTouch(touch.clientX, touch.clientY);
    }

    onTouchEnd(e) {
      if (this.dpadTouchId === null) return;

      const touch = this.findTouchById(e.changedTouches, this.dpadTouchId);
      if (!touch) return;

      e.preventDefault();
      this.dpadTouchId = null;
      this.releaseAllDirections();
    }

    findTouchInsideZone(touchList) {
      if (!this.zoneRect) this.updateZoneRect();
      for (const touch of touchList) {
        const x = touch.clientX;
        const y = touch.clientY;

        if (
          x >= this.zoneRect.left &&
          x <= this.zoneRect.right &&
          y >= this.zoneRect.top &&
          y <= this.zoneRect.bottom
        ) {
          return touch;
        }
      }
      return null;
    }

    findTouchById(touchList, id) {
      for (const touch of touchList) {
        if (touch.identifier === id) return touch;
      }
      return null;
    }

    updateFromTouch(x, y) {
      if (!this.zoneRect) this.updateZoneRect();

      const centerX = this.zoneRect.left + this.zoneRect.width / 2;
      const centerY = this.zoneRect.top + this.zoneRect.height / 2;

      const dx = x - centerX;
      const dy = y - centerY;

      const radius = Math.sqrt(dx * dx + dy * dy);
      const maxRadius = Math.min(this.zoneRect.width, this.zoneRect.height) / 2;
      const deadZone = maxRadius * this.deadZoneRatio;

      if (radius < deadZone) {
        this.setDirections({ up: false, down: false, left: false, right: false });
        return;
      }

      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const next = this.angleToDirections(angle);
      this.setDirections(next);
    }

    angleToDirections(angle) {
      if (angle >= -22.5 && angle < 22.5) {
        return { up: false, down: false, left: false, right: true };
      }
      if (angle >= 22.5 && angle < 67.5) {
        return { up: false, down: true, left: false, right: true };
      }
      if (angle >= 67.5 && angle < 112.5) {
        return { up: false, down: true, left: false, right: false };
      }
      if (angle >= 112.5 && angle < 157.5) {
        return { up: false, down: true, left: true, right: false };
      }
      if (angle >= 157.5 || angle < -157.5) {
        return { up: false, down: false, left: true, right: false };
      }
      if (angle >= -157.5 && angle < -112.5) {
        return { up: true, down: false, left: true, right: false };
      }
      if (angle >= -112.5 && angle < -67.5) {
        return { up: true, down: false, left: false, right: false };
      }
      return { up: true, down: false, left: false, right: true };
    }

    setDirections(next) {
      this.syncKey("up", next.up);
      this.syncKey("down", next.down);
      this.syncKey("left", next.left);
      this.syncKey("right", next.right);
    }

    syncKey(name, pressed) {
      if (this.state[name] === pressed) return;
      this.state[name] = pressed;

      const key = this.keys[name];
      const type = pressed ? "keydown" : "keyup";

      const evt = new KeyboardEvent(type, {
        key,
        code: key,
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(evt);
      window.dispatchEvent(evt);
    }

    releaseAllDirections() {
      this.setDirections({
        up: false,
        down: false,
        left: false,
        right: false,
      });
    }
  }

  window.NostalgiaTouchEngine = NostalgiaTouchEngine;
})();

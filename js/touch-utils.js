/* ===========================
   Touch Utilities Library
   =========================== */

const TouchUtils = {
  // Track touch positions
  touchStart: { x: 0, y: 0, time: 0 },
  touchEnd: { x: 0, y: 0, time: 0 },

  /**
   * Add visual feedback at touch point
   */
  createTouchFeedback(x, y, container = document.body) {
    const feedback = document.createElement('div');
    feedback.className = 'touch-feedback';
    feedback.style.left = `${x}px`;
    feedback.style.top = `${y}px`;
    container.appendChild(feedback);

    setTimeout(() => feedback.remove(), 600);
  },

  /**
   * Detect swipe direction
   * Returns: 'left', 'right', 'up', 'down', or null
   */
  detectSwipe(threshold = 50) {
    const deltaX = this.touchEnd.x - this.touchStart.x;
    const deltaY = this.touchEnd.y - this.touchStart.y;
    const deltaTime = this.touchEnd.time - this.touchStart.time;

    // Require minimum speed (pixels per ms)
    if (deltaTime > 500) return null;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        return deltaX > 0 ? 'right' : 'left';
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        return deltaY > 0 ? 'down' : 'up';
      }
    }

    return null;
  },

  /**
   * Detect long press
   */
  detectLongPress(element, callback, duration = 500) {
    let timer;

    const start = (e) => {
      timer = setTimeout(() => {
        callback(e);
      }, duration);
    };

    const cancel = () => {
      clearTimeout(timer);
    };

    element.addEventListener('touchstart', start);
    element.addEventListener('touchend', cancel);
    element.addEventListener('touchmove', cancel);
    element.addEventListener('mousedown', start);
    element.addEventListener('mouseup', cancel);
    element.addEventListener('mousemove', cancel);

    return () => {
      element.removeEventListener('touchstart', start);
      element.removeEventListener('touchend', cancel);
      element.removeEventListener('touchmove', cancel);
      element.removeEventListener('mousedown', start);
      element.removeEventListener('mouseup', cancel);
      element.removeEventListener('mousemove', cancel);
    };
  },

  /**
   * Detect double tap
   */
  detectDoubleTap(element, callback, delay = 300) {
    let lastTap = 0;

    const handler = (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;

      if (tapLength < delay && tapLength > 0) {
        callback(e);
        e.preventDefault();
      }

      lastTap = currentTime;
    };

    element.addEventListener('touchend', handler);
    element.addEventListener('click', handler);

    return () => {
      element.removeEventListener('touchend', handler);
      element.removeEventListener('click', handler);
    };
  },

  /**
   * Calculate pinch distance
   */
  getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * Calculate rotation angle
   */
  getRotationAngle(touches) {
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  },

  /**
   * Make element draggable
   */
  makeDraggable(element, options = {}) {
    const {
      onDragStart = () => {},
      onDrag = () => {},
      onDragEnd = () => {},
      constrainToParent = false
    } = options;

    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;
    let xOffset = 0;
    let yOffset = 0;

    const dragStart = (e) => {
      const touch = e.type.includes('touch') ? e.touches[0] : e;

      initialX = touch.clientX - xOffset;
      initialY = touch.clientY - yOffset;

      if (e.target === element || element.contains(e.target)) {
        isDragging = true;
        element.classList.add('dragging');
        onDragStart(e);
      }
    };

    const drag = (e) => {
      if (!isDragging) return;

      e.preventDefault();
      const touch = e.type.includes('touch') ? e.touches[0] : e;

      currentX = touch.clientX - initialX;
      currentY = touch.clientY - initialY;

      if (constrainToParent && element.parentElement) {
        const parent = element.parentElement;
        const parentRect = parent.getBoundingClientRect();
        const elemRect = element.getBoundingClientRect();

        currentX = Math.max(0, Math.min(currentX, parentRect.width - elemRect.width));
        currentY = Math.max(0, Math.min(currentY, parentRect.height - elemRect.height));
      }

      xOffset = currentX;
      yOffset = currentY;

      element.style.transform = `translate(${currentX}px, ${currentY}px)`;
      onDrag(e, { x: currentX, y: currentY });
    };

    const dragEnd = (e) => {
      if (!isDragging) return;

      isDragging = false;
      element.classList.remove('dragging');
      initialX = currentX;
      initialY = currentY;
      onDragEnd(e, { x: currentX, y: currentY });
    };

    element.addEventListener('touchstart', dragStart);
    element.addEventListener('touchmove', drag);
    element.addEventListener('touchend', dragEnd);
    element.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    return () => {
      element.removeEventListener('touchstart', dragStart);
      element.removeEventListener('touchmove', drag);
      element.removeEventListener('touchend', dragEnd);
      element.removeEventListener('mousedown', dragStart);
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', dragEnd);
    };
  },

  /**
   * Initialize swipe detection on element
   */
  initSwipe(element, callbacks = {}) {
    const {
      onSwipeLeft = () => {},
      onSwipeRight = () => {},
      onSwipeUp = () => {},
      onSwipeDown = () => {}
    } = callbacks;

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      this.touchStart.x = touch.clientX;
      this.touchStart.y = touch.clientY;
      this.touchStart.time = Date.now();
    };

    const handleTouchEnd = (e) => {
      const touch = e.changedTouches[0];
      this.touchEnd.x = touch.clientX;
      this.touchEnd.y = touch.clientY;
      this.touchEnd.time = Date.now();

      const direction = this.detectSwipe();

      switch(direction) {
        case 'left': onSwipeLeft(e); break;
        case 'right': onSwipeRight(e); break;
        case 'up': onSwipeUp(e); break;
        case 'down': onSwipeDown(e); break;
      }
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  },

  /**
   * Prevent default touch behavior (useful for custom gestures)
   */
  preventDefaultTouch(element) {
    element.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    element.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  },

  /**
   * Get touch/mouse position
   */
  getPosition(e) {
    if (e.type.includes('touch')) {
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
    return {
      x: e.clientX,
      y: e.clientY
    };
  },

  /**
   * Vibrate device (if supported)
   */
  vibrate(pattern = 10) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TouchUtils;
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface CursorConfig {
  name: string;
  color: string;
  speed: number;
  entranceDelay: number;
  offset: { x: number; y: number };
}

interface MotionState {
  hasPrev: boolean;
  intensity: number;
  lingerFrames: number;
  panic: number;
  prevX: number;
  prevY: number;
  tick: number;
}

const CURSORS: CursorConfig[] = [
  { name: 'You', color: '#22c55e', speed: 0.15, entranceDelay: 0, offset: { x: 0, y: 0 } },
  {
    name: 'Backend Agent',
    color: '#3b82f6',
    speed: 0.1,
    entranceDelay: 80,
    offset: { x: 28, y: 20 },
  },
  {
    name: 'Frontend Agent',
    color: '#a855f7',
    speed: 0.07,
    entranceDelay: 160,
    offset: { x: -24, y: 35 },
  },
  {
    name: 'DevOps Agent',
    color: '#f97316',
    speed: 0.05,
    entranceDelay: 240,
    offset: { x: 24, y: 58 },
  },
];

const OFFSET_SCALE = 1.4;
const MIN_CURSOR_DISTANCE = 68;
const CURSOR_BOUNDS_PADDING = { top: 6, right: 132, bottom: 28, left: 4 };
const MOTION_INTENSITY_RISE = 0.42;
const MOTION_INTENSITY_FALL = 0.08;
const MOTION_SPEED_NORMALIZER = 24;
const IDLE_SPREAD_SCALE = 1.7;
const MOVING_SPREAD_SCALE = 0.7;
const PANIC_COLLAPSE_BOOST = 0.28;
const PANIC_DECAY = 0.84;
const PANIC_GAIN = 2.8;
const MAX_JITTER_AMPLITUDE = 10;
const JITTER_START_INTENSITY = 0.26;
const STOP_SPEED_THRESHOLD = 0.55;
const STOP_LINGER_FRAMES = 32;
const LINGER_JITTER_FACTOR = 0.55;
const LINGER_INTENSITY_FLOOR = 0.2;
const LINGER_PANIC_FLOOR = 0.16;
const NATIVE_CURSOR_SELECTOR =
  'input, textarea, button, select, option, a, label, [contenteditable="true"], [role="button"], [role="link"], [role="textbox"]';
const TEXT_SELECTION_SELECTOR = 'p, span, h1, h2, h3, h4, h5, h6, li, blockquote, code, pre';

export default function CollaborativeCursors({ enabled }: { enabled: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerSizeRef = useRef({ width: 0, height: 0 });
  const cursorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mousePos = useRef({ x: -200, y: -200 });
  const lastMouseClientRef = useRef<null | { x: number; y: number }>(null);
  const motionStateRef = useRef<MotionState>({
    hasPrev: false,
    intensity: 0,
    lingerFrames: 0,
    panic: 0,
    prevX: -200,
    prevY: -200,
    tick: 0,
  });
  const cursorPositions = useRef(CURSORS.map(() => ({ x: -200, y: -200 })));
  const animFrameRef = useRef<number>(0);
  const [isInHero, setIsInHero] = useState(false);
  const [showSystemCursor, setShowSystemCursor] = useState(false);
  const isInHeroRef = useRef(false);
  const isTextSelectingRef = useRef(false);
  const showSystemCursorRef = useRef(false);
  const hasInitialized = useRef(false);

  const hideCustomCursor = useCallback(() => {
    if (!isInHeroRef.current) return;
    isInHeroRef.current = false;
    motionStateRef.current.hasPrev = false;
    motionStateRef.current.intensity = 0;
    motionStateRef.current.lingerFrames = 0;
    motionStateRef.current.panic = 0;
    setIsInHero(false);
  }, []);

  useEffect(() => {
    const handleMouseTrack = (e: MouseEvent) => {
      lastMouseClientRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseTrack);
    window.addEventListener('mouseover', handleMouseTrack);
    window.addEventListener('mousedown', handleMouseTrack);
    window.addEventListener('mouseup', handleMouseTrack);
    return () => {
      window.removeEventListener('mousemove', handleMouseTrack);
      window.removeEventListener('mouseover', handleMouseTrack);
      window.removeEventListener('mousedown', handleMouseTrack);
      window.removeEventListener('mouseup', handleMouseTrack);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const updateSystemCursor = (value: boolean) => {
      if (showSystemCursorRef.current === value) return;
      showSystemCursorRef.current = value;
      setShowSystemCursor(value);
    };

    const applyPointerState = (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const isInsideHero =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;

      if (!isInsideHero) {
        hideCustomCursor();
        updateSystemCursor(false);
        return;
      }

      containerSizeRef.current = { width: rect.width, height: rect.height };
      const overNativeAction =
        isPointOverInteractiveControl(clientX, clientY) ||
        isTextSelectingRef.current ||
        hasActiveTextSelection();
      updateSystemCursor(overNativeAction);

      if (overNativeAction) {
        return;
      }

      const bounds = getContainerBounds(containerSizeRef.current);
      mousePos.current = { x: clientX - rect.left, y: clientY - rect.top };
      if (!motionStateRef.current.hasPrev) {
        motionStateRef.current.hasPrev = true;
        motionStateRef.current.prevX = mousePos.current.x;
        motionStateRef.current.prevY = mousePos.current.y;
      }
      if (!isInHeroRef.current) {
        isInHeroRef.current = true;
        setIsInHero(true);
        if (!hasInitialized.current) {
          hasInitialized.current = true;
          cursorPositions.current = CURSORS.map((cursor, i) =>
            getCursorTarget(cursor, i, mousePos.current, bounds, motionStateRef.current),
          );
          resolveCursorCollisions(cursorPositions.current, bounds);
          cursorRefs.current.forEach((el, i) => {
            if (!el) return;
            const pos = cursorPositions.current[i];
            el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
          });
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      applyPointerState(e.clientX, e.clientY);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const isInsideHero =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!isInsideHero) return;

      if (isPointOverInteractiveControl(e.clientX, e.clientY)) {
        isTextSelectingRef.current = false;
        updateSystemCursor(true);
        return;
      }

      isTextSelectingRef.current = isSelectableTextTarget(e.target);
      if (isTextSelectingRef.current) {
        updateSystemCursor(true);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      isTextSelectingRef.current = false;
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const isInsideHero =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!isInsideHero) {
        updateSystemCursor(false);
        return;
      }

      updateSystemCursor(
        isPointOverInteractiveControl(e.clientX, e.clientY) || hasActiveTextSelection(),
      );
    };

    const handleWindowOut = (e: MouseEvent) => {
      if (e.relatedTarget !== null) return;
      isTextSelectingRef.current = false;
      hideCustomCursor();
      updateSystemCursor(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseout', handleWindowOut);

    const initialPoint = getInitialClientPoint(lastMouseClientRef.current);
    if (initialPoint) {
      applyPointerState(initialPoint.x, initialPoint.y);
    }

    const animate = () => {
      const bounds = getContainerBounds(containerSizeRef.current);
      updateMotionState(motionStateRef.current, mousePos.current);
      const motionState = motionStateRef.current;

      CURSORS.forEach((cursor, i) => {
        const target = getCursorTarget(cursor, i, mousePos.current, bounds, motionState);
        const speedFactor =
          cursor.name === 'You'
            ? 1
            : clamp(0.95 + motionState.intensity * 1.35 + motionState.panic * 1.1, 0.95, 3.1);
        const pos = cursorPositions.current[i];
        pos.x += (target.x - pos.x) * cursor.speed * speedFactor;
        pos.y += (target.y - pos.y) * cursor.speed * speedFactor;
      });

      resolveCursorCollisions(cursorPositions.current, bounds);

      cursorPositions.current.forEach((pos, i) => {
        const el = cursorRefs.current[i];
        if (!el) return;
        el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseout', handleWindowOut);
      cancelAnimationFrame(animFrameRef.current);
      isTextSelectingRef.current = false;
      hideCustomCursor();
      showSystemCursorRef.current = false;
      setShowSystemCursor(false);
    };
  }, [enabled, hideCustomCursor]);

  useEffect(() => {
    if (!enabled || showSystemCursor || !isInHero) {
      document.body.style.removeProperty('cursor');
      return;
    }
    document.body.style.cursor = 'none';
    return () => {
      document.body.style.removeProperty('cursor');
    };
  }, [enabled, isInHero, showSystemCursor]);

  if (!enabled) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 z-20" style={{ pointerEvents: 'none' }}>
      {CURSORS.map((cursor, i) => (
        <div
          key={cursor.name}
          ref={(el) => {
            cursorRefs.current[i] = el;
          }}
          className="absolute top-0 left-0 pointer-events-none"
          style={{
            willChange: 'transform',
            transform: 'translate3d(-200px, -200px, 0)',
            zIndex: cursor.name === 'You' ? 4 : 3 - i,
            opacity: isInHero && !showSystemCursor ? 1 : 0,
            scale: isInHero ? '1' : '0.8',
            transition: showSystemCursor
              ? 'none'
              : isInHero
                ? `opacity 300ms ${cursor.entranceDelay}ms ease-out, scale 300ms ${cursor.entranceDelay}ms ease-out`
                : 'opacity 200ms ease-in, scale 200ms ease-in',
          }}
        >
          <CursorSVG color={cursor.color} />
          <div
            className={`absolute left-3 top-4 whitespace-nowrap rounded-full font-sans-serif text-white ${
              cursor.name === 'You'
                ? 'px-2.5 py-1 text-xs font-semibold'
                : 'px-2 py-0.5 text-[11px] font-medium'
            }`}
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </div>
        </div>
      ))}
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampNonPrimaryCursors(positions: { x: number; y: number }[], bounds: Bounds | null) {
  if (!bounds) return;
  CURSORS.forEach((cursor, index) => {
    if (cursor.name === 'You') return;
    const pos = positions[index];
    pos.x = clamp(pos.x, bounds.minX, bounds.maxX);
    pos.y = clamp(pos.y, bounds.minY, bounds.maxY);
  });
}

function CursorSVG({ color }: { color: string }) {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 1L1 15.5L4.75 11.25L8.75 19L11.5 17.75L7.5 10H13L1 1Z"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getContainerBounds(size: { height: number; width: number }): Bounds | null {
  if (size.width <= 0 || size.height <= 0) return null;
  return {
    minX: CURSOR_BOUNDS_PADDING.left,
    maxX: Math.max(CURSOR_BOUNDS_PADDING.left, size.width - CURSOR_BOUNDS_PADDING.right),
    minY: CURSOR_BOUNDS_PADDING.top,
    maxY: Math.max(CURSOR_BOUNDS_PADDING.top, size.height - CURSOR_BOUNDS_PADDING.bottom),
  };
}

function getCursorTarget(
  cursor: CursorConfig,
  index: number,
  mouse: { x: number; y: number },
  bounds: Bounds | null,
  motionState: MotionState,
) {
  if (cursor.name === 'You') {
    return { x: mouse.x, y: mouse.y };
  }

  const spreadRange = IDLE_SPREAD_SCALE - MOVING_SPREAD_SCALE;
  const baseSpreadScale = MOVING_SPREAD_SCALE + (1 - motionState.intensity) * spreadRange;
  const spreadScale = clamp(baseSpreadScale - motionState.panic * PANIC_COLLAPSE_BOOST, 0.5, 2);
  const jitterMotion = clamp(
    (motionState.intensity - JITTER_START_INTENSITY) / (1 - JITTER_START_INTENSITY),
    0,
    1,
  );
  const jitterLinger =
    clamp(motionState.lingerFrames / STOP_LINGER_FRAMES, 0, 1) * LINGER_JITTER_FACTOR;
  const jitterWeight = clamp(Math.max(jitterMotion, jitterLinger), 0, 1);
  const jitterAmplitude =
    MAX_JITTER_AMPLITUDE * jitterWeight * (1 - motionState.panic * 0.35) * (0.45 + index * 0.12);
  const wobbleTime = motionState.tick * 0.07;
  const jitterX = Math.sin(wobbleTime * (1.05 + index * 0.17) + index * 1.4) * jitterAmplitude;
  const jitterY =
    Math.cos(wobbleTime * (0.9 + index * 0.13) + index * 1.9) * jitterAmplitude * 0.85;

  let offsetX = cursor.offset.x * OFFSET_SCALE * spreadScale + jitterX;
  let offsetY = cursor.offset.y * OFFSET_SCALE * spreadScale + jitterY;

  if (bounds) {
    const nextX = mouse.x + offsetX;
    const nextY = mouse.y + offsetY;
    if (nextX < bounds.minX || nextX > bounds.maxX) {
      offsetX = -offsetX;
    }
    if (nextY < bounds.minY || nextY > bounds.maxY) {
      offsetY = -offsetY;
    }
  }

  const targetX = mouse.x + offsetX;
  const targetY = mouse.y + offsetY;
  if (!bounds) {
    return { x: targetX, y: targetY };
  }

  return {
    x: clamp(targetX, bounds.minX, bounds.maxX),
    y: clamp(targetY, bounds.minY, bounds.maxY),
  };
}

function getInitialClientPoint(lastKnown: null | { x: number; y: number }) {
  if (lastKnown) return lastKnown;

  const hovered = Array.from(document.querySelectorAll(':hover')).reverse();
  for (const element of hovered) {
    if (!(element instanceof Element)) continue;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  return null;
}

function hasActiveTextSelection() {
  const selection = window.getSelection();
  return Boolean(selection && !selection.isCollapsed && selection.toString().trim().length > 0);
}

function isPointOverInteractiveControl(x: number, y: number) {
  return document.elementsFromPoint(x, y).some((element) => {
    return (
      element.matches(NATIVE_CURSOR_SELECTOR) || Boolean(element.closest(NATIVE_CURSOR_SELECTOR))
    );
  });
}

function isSelectableTextTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;

  const textElement = target.matches(TEXT_SELECTION_SELECTOR)
    ? target
    : target.closest(TEXT_SELECTION_SELECTOR);
  if (!textElement) return false;

  const style = window.getComputedStyle(textElement);
  if (style.userSelect === 'none') return false;
  return Boolean(textElement.textContent?.trim());
}

function resolveCursorCollisions(positions: { x: number; y: number }[], bounds: Bounds | null) {
  for (let i = 0; i < CURSORS.length; i += 1) {
    for (let j = i + 1; j < CURSORS.length; j += 1) {
      const a = positions[i];
      const b = positions[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let distance = Math.hypot(dx, dy);

      if (distance < 0.001) {
        dx = CURSORS[j].offset.x - CURSORS[i].offset.x || j - i;
        dy = CURSORS[j].offset.y - CURSORS[i].offset.y || i + 1;
        distance = Math.hypot(dx, dy);
      }

      if (distance >= MIN_CURSOR_DISTANCE) continue;

      const overlap = MIN_CURSOR_DISTANCE - distance;
      const nx = dx / distance;
      const ny = dy / distance;
      const aIsYou = CURSORS[i].name === 'You';
      const bIsYou = CURSORS[j].name === 'You';

      if (aIsYou && !bIsYou) {
        b.x += nx * overlap;
        b.y += ny * overlap;
        continue;
      }
      if (!aIsYou && bIsYou) {
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        continue;
      }

      const half = overlap / 2;
      a.x -= nx * half;
      a.y -= ny * half;
      b.x += nx * half;
      b.y += ny * half;
    }
  }

  clampNonPrimaryCursors(positions, bounds);
}

function updateMotionState(motionState: MotionState, mouse: { x: number; y: number }) {
  if (!motionState.hasPrev) {
    motionState.hasPrev = true;
    motionState.prevX = mouse.x;
    motionState.prevY = mouse.y;
    return;
  }

  const dx = mouse.x - motionState.prevX;
  const dy = mouse.y - motionState.prevY;
  motionState.prevX = mouse.x;
  motionState.prevY = mouse.y;
  motionState.tick += 1;

  const speed = Math.hypot(dx, dy);
  const targetIntensity = clamp(speed / MOTION_SPEED_NORMALIZER, 0, 1);
  if (targetIntensity > 0.06) {
    motionState.lingerFrames = STOP_LINGER_FRAMES;
  } else if (motionState.lingerFrames > 0) {
    motionState.lingerFrames -= 1;
  }

  const isLingering = speed < STOP_SPEED_THRESHOLD && motionState.lingerFrames > 0;
  const effectiveTargetIntensity = isLingering
    ? Math.max(targetIntensity, LINGER_INTENSITY_FLOOR)
    : targetIntensity;
  const smoothing =
    effectiveTargetIntensity > motionState.intensity
      ? MOTION_INTENSITY_RISE
      : MOTION_INTENSITY_FALL;
  const previousIntensity = motionState.intensity;
  motionState.intensity += (effectiveTargetIntensity - motionState.intensity) * smoothing;
  const intensityDelta = motionState.intensity - previousIntensity;
  if (isLingering) {
    motionState.panic = Math.max(motionState.panic * PANIC_DECAY, LINGER_PANIC_FLOOR);
    return;
  }

  motionState.panic = clamp(
    motionState.panic * PANIC_DECAY + Math.max(intensityDelta, 0) * PANIC_GAIN,
    0,
    1,
  );
}

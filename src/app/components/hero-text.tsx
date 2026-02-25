'use client';

import { useEffect, useRef, useState } from 'react';

const MENTION = '@channel';
const MESSAGE = 'your AI team just joined your workspace!';
const FULL_TEXT = `${MENTION} ${MESSAGE}`;
const MENTION_END = MENTION.length;

const SPEED = 50;
const JITTER = 20;
const START_DELAY = 750;
const PAUSE_AFTER_MENTION = 1000;

const MENTION_COLOR = '#912E9E';
const INK_COLOR = '#121317';

interface HeroTextProps {
  onComplete?: () => void;
}

export default function HeroText({ onComplete }: HeroTextProps) {
  const [revealed, setRevealed] = useState(0);
  const [cursorColor, setCursorColor] = useState(MENTION_COLOR);
  const [showCursor, setShowCursor] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    let pos = 0;

    function step() {
      pos++;
      setRevealed(pos);

      if (pos === MENTION_END + 1) {
        setCursorColor(INK_COLOR);
        timeoutRef.current = setTimeout(step, PAUSE_AFTER_MENTION);
      } else if (pos < FULL_TEXT.length) {
        const delay = SPEED + (Math.random() * JITTER * 2 - JITTER);
        timeoutRef.current = setTimeout(step, delay);
      } else {
        timeoutRef.current = setTimeout(() => {
          setShowCursor(false);
          onComplete?.();
        }, 200);
      }
    }

    timeoutRef.current = setTimeout(step, START_DELAY);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onComplete]);

  const chars = FULL_TEXT.split('');
  const done = revealed >= chars.length;

  return (
    <h1 className="text-center w-full max-w-5xl px-4 font-sans-serif tracking-tight leading-[1.1] text-7xl text-ink">
      {chars.map((char, i) => {
        const hasCursor = showCursor && i === revealed && !done;
        return (
          <span
            key={i}
            style={{
              color: i < revealed ? colorFor(i) : 'transparent',
              position: hasCursor ? 'relative' : undefined,
            }}
          >
            {char}
            {hasCursor && (
              <span
                className="typewriter-cursor"
                style={{ '--cursor-color': cursorColor } as React.CSSProperties}
              />
            )}
          </span>
        );
      })}
      {done && showCursor && (
        <span style={{ position: 'relative' }}>
          <span
            className="typewriter-cursor"
            style={{ '--cursor-color': cursorColor } as React.CSSProperties}
          />
        </span>
      )}
    </h1>
  );
}

function colorFor(index: number): string {
  return index < MENTION_END ? MENTION_COLOR : INK_COLOR;
}

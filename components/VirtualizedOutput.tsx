"use client";

import { memo, useEffect, useMemo, useState } from "react";

const MAX_STATIC_LINE_COUNT = 500;
const LINE_HEIGHT_PX = 24;
const VIEWPORT_HEIGHT_PX = 432;
const BUFFER_LINE_COUNT = 20;

interface VirtualizedOutputProps {
  text: string;
}

export const VirtualizedOutput = memo(function VirtualizedOutput({
  text,
}: VirtualizedOutputProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const lines = useMemo(() => text.replace(/\r\n/g, "\n").split("\n"), [text]);

  useEffect(() => {
    setScrollTop(0);
  }, [text]);

  if (lines.length <= MAX_STATIC_LINE_COUNT) {
    return (
      <pre
        className="min-h-[18rem] overflow-x-auto rounded-lg border border-[color:var(--border)] bg-stone-900 px-3 py-3 font-mono text-sm leading-6 text-stone-100"
        tabIndex={0}
        aria-label="Transformation output"
      >
        {text}
      </pre>
    );
  }

  const startIndex = Math.max(
    Math.floor(scrollTop / LINE_HEIGHT_PX) - BUFFER_LINE_COUNT,
    0,
  );
  const endIndex = Math.min(
    Math.ceil((scrollTop + VIEWPORT_HEIGHT_PX) / LINE_HEIGHT_PX) +
      BUFFER_LINE_COUNT,
    lines.length,
  );
  const visibleLines = lines.slice(startIndex, endIndex);

  return (
    <div
      className="min-h-[18rem] overflow-auto rounded-lg border border-[color:var(--border)] bg-stone-900 font-mono text-sm leading-6 text-stone-100"
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      style={{ height: `${VIEWPORT_HEIGHT_PX}px` }}
      tabIndex={0}
      aria-label="Transformation output"
    >
      <div
        style={{
          height: `${lines.length * LINE_HEIGHT_PX}px`,
          position: "relative",
          width: "max-content",
          minWidth: "100%",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: `${startIndex * LINE_HEIGHT_PX}px`,
            left: 0,
            right: 0,
          }}
        >
          {visibleLines.map((line, index) => (
            <div
              key={`${startIndex + index}-${line}`}
              className="px-4"
              style={{
                height: `${LINE_HEIGHT_PX}px`,
                whiteSpace: "pre",
              }}
            >
              {line.length > 0 ? line : "\u00A0"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

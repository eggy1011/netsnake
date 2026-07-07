import { useEffect, useRef } from "react";
import { GRID_SIZE, type GameState } from "../types/game";

const CELL = 26; // logical pixels per cell; canvas scales responsively via CSS

type Props = { state: GameState };

export default function GameCanvas({ state }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = GRID_SIZE * CELL;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* --- background --- */
    ctx.fillStyle = "#0a0f1e";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(34, 211, 238, 0.07)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL + 0.5, 0);
      ctx.lineTo(i * CELL + 0.5, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL + 0.5);
      ctx.lineTo(size, i * CELL + 0.5);
      ctx.stroke();
    }

    const px = (n: number) => n * CELL;

    /* --- obstacles: circuit-board blocks --- */
    for (const o of state.obstacles) {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(px(o.x) + 2, px(o.y) + 2, CELL - 4, CELL - 4);
      ctx.strokeStyle = "#f472b6";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px(o.x) + 3.5, px(o.y) + 3.5, CELL - 7, CELL - 7);
      ctx.fillStyle = "#f472b6";
      ctx.fillRect(px(o.x) + CELL / 2 - 2, px(o.y) + CELL / 2 - 2, 4, 4);
    }

    /* --- food --- */
    const t = performance.now() / 1000;
    for (const f of state.foods) {
      const cx = px(f.position.x) + CELL / 2;
      const cy = px(f.position.y) + CELL / 2;
      const wobble = Math.sin(t * 4 + f.id) * 1.5;

      if (f.type === "normal") {
        // glowing data packet
        ctx.shadowColor = "#4ade80";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#4ade80";
        ctx.beginPath();
        ctx.arc(cx, cy, CELL / 3 + wobble * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (f.type === "bonus") {
        // pulsing star
        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = 14;
        ctx.fillStyle = "#facc15";
        drawStar(ctx, cx, cy, 5, CELL / 2.4 + wobble * 0.5, CELL / 5);
        ctx.shadowBlur = 0;
      } else {
        // question packet
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#c084fc";
        roundRect(ctx, cx - CELL / 2.8, cy - CELL / 2.8, CELL / 1.4, CELL / 1.4, 5);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#0a0f1e";
        ctx.font = `bold ${CELL * 0.6}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", cx, cy + 1);
      }
    }

    /* --- snake: neon gradient body --- */
    const len = state.snake.length;
    state.snake.forEach((seg, i) => {
      const isHead = i === 0;
      const fade = 1 - (i / len) * 0.55;
      const green = Math.round(222 * fade);
      ctx.fillStyle = isHead
        ? "#a7f3d0"
        : `rgba(74, ${green}, 128, ${0.55 + fade * 0.45})`;
      ctx.shadowColor = "#4ade80";
      ctx.shadowBlur = isHead ? 12 : 5;
      const pad = isHead ? 2 : 3;
      roundRect(
        ctx,
        px(seg.x) + pad,
        px(seg.y) + pad,
        CELL - pad * 2,
        CELL - pad * 2,
        isHead ? 7 : 5
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      if (isHead) {
        // eyes
        ctx.fillStyle = "#0a0f1e";
        const d = state.direction;
        const ex = d === "left" ? -4 : d === "right" ? 4 : 0;
        const ey = d === "up" ? -4 : d === "down" ? 4 : 0;
        const cx = px(seg.x) + CELL / 2;
        const cy = px(seg.y) + CELL / 2;
        const perpX = d === "up" || d === "down" ? 5 : 0;
        const perpY = d === "left" || d === "right" ? 5 : 0;
        ctx.beginPath();
        ctx.arc(cx + ex + perpX, cy + ey + perpY, 2.2, 0, Math.PI * 2);
        ctx.arc(cx + ex - perpX, cy + ey - perpY, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    /* --- floating score text --- */
    for (const ft of state.floatingTexts) {
      const age = state.tick - ft.bornAtTick;
      const alpha = Math.max(0, 1 - age / 10);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${CELL * 0.65}px monospace`;
      ctx.textAlign = "center";
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(
        ft.text,
        px(ft.position.x) + CELL / 2,
        px(ft.position.y) - age * 2.5
      );
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      className="neon-border w-full max-w-[624px] rounded-lg border border-cyan-900/60"
      style={{ aspectRatio: "1 / 1", imageRendering: "auto" }}
      aria-label="Snake game board"
    />
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outer: number,
  inner: number
) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

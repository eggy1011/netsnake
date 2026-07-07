import {
  GRID_SIZE,
  type Food,
  type FoodType,
  type Point,
} from "../types/game";
import { samePoint } from "./collisionDetection";

let nextFoodId = 1;

/** Random free cell not occupied by the snake, obstacles, or other food. */
export function randomFreeCell(occupied: Point[]): Point | null {
  const free: Point[] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const p = { x, y };
      if (!occupied.some((o) => samePoint(o, p))) free.push(p);
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)];
}

export function spawnFood(
  type: FoodType,
  occupied: Point[],
  tick: number
): Food | null {
  const position = randomFreeCell(occupied);
  if (!position) return null;
  return {
    id: nextFoodId++,
    type,
    position,
    // Bonus food disappears after ~7 seconds worth of ticks (rough; the
    // reducer compares against the tick counter, which advances per move).
    expiresAtTick: type === "bonus" ? tick + 50 : undefined,
  };
}

/** Generate obstacle cells away from the snake's spawn row and each other. */
export function generateObstacles(count: number, snake: Point[]): Point[] {
  const obstacles: Point[] = [];
  // Keep a safety margin around the snake so obstacles never spawn on or
  // directly in front of it.
  const buffered: Point[] = [...snake];
  snake.forEach((s) => {
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        buffered.push({ x: s.x + dx, y: s.y + dy });
      }
    }
  });
  for (let i = 0; i < count; i++) {
    const cell = randomFreeCell([...buffered, ...obstacles]);
    if (cell) obstacles.push(cell);
  }
  return obstacles;
}

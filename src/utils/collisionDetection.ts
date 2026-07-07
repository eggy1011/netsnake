import { GRID_SIZE, type Point } from "../types/game";

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

export function hitsWall(p: Point): boolean {
  return p.x < 0 || p.y < 0 || p.x >= GRID_SIZE || p.y >= GRID_SIZE;
}

/** Self collision — `body` should exclude the tail cell if it will move away. */
export function hitsBody(head: Point, body: Point[]): boolean {
  return body.some((seg) => samePoint(seg, head));
}

export function hitsObstacle(head: Point, obstacles: Point[]): boolean {
  return obstacles.some((o) => samePoint(o, head));
}

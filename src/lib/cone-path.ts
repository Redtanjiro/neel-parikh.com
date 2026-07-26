/**
 * The light cone is a clip-path quadrilateral anchored at the lamp's final
 * head position (left third, upper-middle — spec section 3's recommended
 * anchor, kept here as the single source of truth so the cone geometry and
 * the hero layer's exit anchor agree).
 *
 * spread: 0 = degenerate sliver at the apex (invisible), 1 = full wedge.
 * All values are viewport percentages.
 */
export const CONE_APEX = { x: 9, y: 17 };

const FULL = {
  topRight: { x: 100, y: 25 },
  bottomRight: { x: 100, y: 100 },
  bottomLeft: { x: 7, y: 100 },
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function buildConePolygon(spread: number): string {
  const t = Math.max(0, Math.min(1, spread));
  const p = (target: { x: number; y: number }) => ({
    x: lerp(CONE_APEX.x, target.x, t),
    y: lerp(CONE_APEX.y, target.y, t),
  });
  const tr = p(FULL.topRight);
  const br = p(FULL.bottomRight);
  const bl = p(FULL.bottomLeft);
  const pts = [CONE_APEX, tr, br, bl]
    .map((pt) => `${pt.x}% ${pt.y}%`)
    .join(", ");
  return `polygon(${pts})`;
}

function surface(x, y, previous, areas) {
  let best = null;
  for (const [a, b, w, d, base, dx, dy, rise] of areas) {
    if (x < a || y < b || x > a + w || y > b + d) {
      continue;
    }

    const t = dx
      ? dx > 0
        ? (x - a) / w
        : 1 - (x - a) / w
      : dy
        ? dy > 0
          ? (y - b) / d
          : 1 - (y - b) / d
        : 0;
    const h = base + t * rise;
    if (
      Math.abs(h - previous) < 0.29 &&
      (best === null || Math.abs(previous - h) < Math.abs(previous - best))
    ) {
      best = h;
    }
  }

  return best;
}

export function walkHeight(x, y, previous, nav) {
  const radius = 0.17;
  const h = surface(x, y, previous, nav.areas);
  if (h === null) {
    return null;
  }

  for (const [dx, dy] of [
    [radius, 0],
    [-radius, 0],
    [0, radius],
    [0, -radius],
  ]) {
    if (surface(x + dx, y + dy, h, nav.areas) === null) {
      return null;
    }
  }

  for (const [a, b, w, d, angle, lo, hi] of nav.solids) {
    if (hi <= h + 0.22 || lo >= h + 1.67) {
      continue;
    }

    const dx = x - a;
    const dy = y - b;
    const localX = Math.abs(dx * Math.cos(angle) + dy * Math.sin(angle)) - w / 2;
    const localY = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle)) - d / 2;
    if (Math.hypot(Math.max(0, localX), Math.max(0, localY)) < radius) {
      return null;
    }
  }

  return h;
}

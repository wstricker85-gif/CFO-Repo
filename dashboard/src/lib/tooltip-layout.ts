/** Viewport-bounded placement, including short landscape screens and large cards. */
export function metricPanelPosition(
  anchor: { left: number; right: number; top: number; bottom: number },
  viewport: { width: number; height: number; left?: number; top?: number },
  preferredHeight = 285,
) {
  const edge = 16,
    originX = viewport.left ?? 0,
    originY = viewport.top ?? 0;
  const width = Math.max(1, Math.min(340, viewport.width - edge * 2));
  const availableHeight = Math.max(1, viewport.height - edge * 2);
  const height = Math.min(preferredHeight, availableHeight);
  const left = Math.max(
    originX + edge,
    Math.min(anchor.right - width, originX + viewport.width - width - edge),
  );
  const below = Math.max(0, originY + viewport.height - anchor.bottom - 28);
  const above = Math.max(0, anchor.top - originY - 28);
  if (Math.max(below, above) < Math.min(160, height))
    return { left, top: originY + edge, width, maxHeight: availableHeight };
  if (below >= height || below >= above)
    return {
      left,
      top: Math.max(originY + edge, anchor.bottom + 12),
      width,
      maxHeight: Math.max(1, Math.min(below, availableHeight)),
    };
  const top = Math.max(
    originY + edge,
    Math.min(anchor.top - height - 12, originY + viewport.height - edge - height),
  );
  return {
    left,
    top,
    width,
    maxHeight: Math.max(1, Math.min(above, originY + viewport.height - edge - top)),
  };
}

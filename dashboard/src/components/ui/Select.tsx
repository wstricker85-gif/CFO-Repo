import type { ComponentProps } from "react";

/** Native keyboard and touch picker with a consistently inset decorative chevron. */
export function Select(props: ComponentProps<"select">) {
  return (
    <span className="select-shell">
      <select {...props} />
    </span>
  );
}

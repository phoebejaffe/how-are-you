export function mergeRefs<T>(...refs: Array<((node: T | null) => void) | { current: T | null } | null>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else ref.current = node;
    }
  };
}

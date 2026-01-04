let queue: Promise<void> = Promise.resolve();

export async function withGenerationSlotLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = queue;
  let release!: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  queue = prev.then(() => next);
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

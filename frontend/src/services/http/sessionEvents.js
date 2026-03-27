const listeners = new Set()

export function subscribeToUnauthorized(listener) {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

export function emitUnauthorized() {
  listeners.forEach((listener) => listener())
}

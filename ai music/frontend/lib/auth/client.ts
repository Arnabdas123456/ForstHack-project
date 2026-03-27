export const AUTH_STATE_CHANGED_EVENT = "lofigen:auth-state-changed"

export function notifyAuthStateChanged() {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT))
}

export async function logoutUser() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    cache: "no-store",
  })

  if (!response.ok) {
    let message = "Unable to log out"

    try {
      const data = (await response.json()) as { error?: string }
      message = data.error || message
    } catch {
      // Keep default message when response payload is not JSON.
    }

    throw new Error(message)
  }

  notifyAuthStateChanged()
}

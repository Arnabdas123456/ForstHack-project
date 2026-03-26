export const LIBRARY_CHANGED_EVENT = "lofigen:library-changed"

export function notifyLibraryChanged() {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(LIBRARY_CHANGED_EVENT))
}

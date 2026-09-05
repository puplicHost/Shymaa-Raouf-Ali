// Minimal DOM stubs so services that touch the browser can be unit tested
// in Node without throwing. InteractionEngine gracefully no-ops when
// `document.getElementById` returns null.

globalThis.document = {
  getElementById: () => null,
  getElementsByClassName: () => [],
}

globalThis.window = {
  location: { href: 'http://localhost' },
  open: () => true,
}

if (!globalThis.navigator) {
  globalThis.navigator = { language: 'en-US' }
}
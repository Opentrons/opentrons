// If the system boots while no network connection is available, then some requests to localhost
// hang eternally while connecting (so no request timeouts work either) and things get
// generally weird. Overriding the browser API to pretend to always be "online" fixes this.
// It makes sense; if "onLine" is false, that means that any network call is _guaranteed_ to fail
// so middlewares probably elide them; but we really want it to be true basically always because
// most of what we do is via localhost.
//
// This function is exposed in its own module so it can be mocked in testing
// since jest really doesn't like you doing this.

export const hackWindowNavigatorOnLine = (): void => {
  Object.defineProperty(window.navigator, 'onLine', {
    get: () => true,
  })
  window.dispatchEvent(new Event('online'))
}

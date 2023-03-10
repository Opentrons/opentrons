import { platform } from 'process'
// Provide systemd when possible and a default mocked instance, used only during
// dev workflows, when not.

interface SDNotify {
  ready: () => void
  sendStatus: (text: string) => void
}

const provideExports = (): SDNotify => {
  try {
    // This has to be a require because import is async when used functionally,
    // and to catch import errors you have to use it functionally, so it can't be
    // at top level, and we're doing this to put stuff in exports, so let's
    // refactor this whenever we turn on top-level async
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const systemdNotify = require('sd-notify')
    return { ready: systemdNotify.ready, sendStatus: systemdNotify.sendStatus }
  } catch (err) {
    if (platform === 'linux') {
      console.error(
        'Could not import systemd on linux, where it should be present. This is most likely because libsystemd bindings are not available, which hopefully means this is a dev setup.'
      )
    }
    return {
      ready: () => console.log('would send sd-notify ready'),
      sendStatus: (text: string) =>
        console.log(`would send sd-notify status ${text}`),
    }
  }
}

// Finally, we want this to work just like the actual sd-notify imports, so a default
// export it is
// eslint-disable-next-line import/no-default-export
export default provideExports()

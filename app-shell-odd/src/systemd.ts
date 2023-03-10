import { platform } from 'process'

async function provideLinuxExports() {
  const sdNotify = await import('sd-notify')
  return { ready: sdNotify.ready, sendStatus: sdNotify.sendStatus }
}

async function provideMockExports() {
  return {
    ready: () => console.log('would send sd-notify ready'),
    sendStatus: (text: string) =>
      console.log(`would send sd-notify status ${text}`),
  }
}

async function provideExportsForPlatform(forPlatform: 'linux' | string) {
  if (forPlatform === 'linux') {
    return await provideLinuxExports()
  } else {
    return await provideMockExports()
  }
}

export default await provideExportsForPlatform(platform)

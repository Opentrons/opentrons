import { exec } from 'child_process'
import { readFile, stat, writeFile } from 'fs/promises'
import { platform } from 'process'

// Provide systemd when possible and a default mocked instance, used only during
// dev workflows, when not.

function promisifyProcess(command: string, quiet?: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err && quiet !== true) {
        console.warn(
          `${command} failed: ${err.code}: ${err.message}: ${stderr}`
        )
        reject(stderr)
      }
      resolve(stdout ?? stderr)
    })
  })
}

const NEW_ODD_BRIGHTNESS_PATH =
  '/sys/class/backlight/backlight-verdin-dsi/brightness'
const OLD_ODD_BRIGHTNESS_PATH =
  '/sys/class/backlight/backlight/device/backlight/backlight/brightness'

function writeBrightness(text: string): Promise<string> {
  return stat(NEW_ODD_BRIGHTNESS_PATH)
    .then(() =>
      writeFile(NEW_ODD_BRIGHTNESS_PATH, text).then(() =>
        readFile(NEW_ODD_BRIGHTNESS_PATH, 'ascii')
      )
    )
    .catch(() =>
      writeFile(OLD_ODD_BRIGHTNESS_PATH, text).then(() =>
        readFile(OLD_ODD_BRIGHTNESS_PATH, 'ascii')
      )
    )
}

const verbForState = (state: boolean): string => (state ? 'start' : 'stop')

interface SystemD {
  ready: () => Promise<string>
  sendStatus: (text: string) => Promise<string>
  setRemoteDevToolsEnabled: (enabled: boolean) => Promise<string>
  getIsBackendReady: () => Promise<boolean>
  restartApp: () => Promise<string>
  updateBrightness: (text: string) => Promise<string>
}

const provideExports = (): SystemD => {
  if (platform === 'linux') {
    return {
      ready: () => promisifyProcess('/bin/systemd-notify --ready'),
      sendStatus: text =>
        promisifyProcess(`/bin/systemd-notify --status=${text}`),
      setRemoteDevToolsEnabled: enabled =>
        promisifyProcess(
          `/bin/systemctl ${verbForState(
            enabled
          )} opentrons-robot-app-devtools.socket`
        ),
      getIsBackendReady: async () => {
        // trimming string because stdout returns a new line
        const isRobotServerReady =
          (
            await promisifyProcess(
              '/bin/systemctl is-active opentrons-robot-server',
              true
            )
          ).trim() === 'active'
        const isAuthServerReady =
          (
            await promisifyProcess(
              '/bin/systemctl is-active opentrons-auth-server',
              true
            )
          ).trim() === 'active'
        return isRobotServerReady && isAuthServerReady
      },
      restartApp: () =>
        promisifyProcess(`/bin/systemctl restart opentrons-robot-app`),
      updateBrightness: writeBrightness,
    }
  } else {
    return {
      ready: () =>
        new Promise<string>(resolve => {
          resolve('fake notify done')
        }),
      sendStatus: text =>
        new Promise<string>(resolve => {
          resolve(`fake status done for ${text}`)
        }),
      setRemoteDevToolsEnabled: enabled =>
        new Promise<string>(resolve => {
          resolve(`dev tools set to ${enabled}`)
        }),
      getIsBackendReady: () =>
        new Promise<boolean>(resolve => {
          resolve(true)
        }),
      restartApp: () =>
        new Promise<string>(resolve => {
          resolve('')
        }),
      updateBrightness: text =>
        new Promise<string>(resolve => {
          resolve(`fake brightness ${text} was set`)
        }),
    }
  }
}
// eslint-disable-next-line import/no-default-export
export default provideExports()

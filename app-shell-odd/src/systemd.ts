import { platform } from 'process'
import { exec } from 'child_process'
import type { RobotServerServiceStatus } from '@opentrons/app/src/redux/shell/robot-system/types'
// Provide systemd when possible and a default mocked instance, used only during
// dev workflows, when not.

function promisifyProcess(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.warn(
          `${command} failed: ${err.code}: ${err.message}: ${stderr}`
        )
        reject(stderr)
      }
      resolve(stdout ?? stderr)
    })
  })
}

const verbForState = (state: boolean): string => (state ? 'start' : 'stop')

interface SystemD {
  ready: () => Promise<string>
  sendStatus: (text: string) => Promise<string>
  setRemoteDevToolsEnabled: (enabled: boolean) => Promise<string>
  getRobotServerStatus: () => Promise<RobotServerServiceStatus>
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
      getRobotServerStatus: () =>
        promisifyProcess(
          '/bin/systemctl is-active opentrons-robot-server'
          // trimming string because stdout returns a new line
        ).then(state => state.trim() as RobotServerServiceStatus),
    }
  } else {
    return {
      ready: () => new Promise<string>(resolve => resolve('fake notify done')),
      sendStatus: text =>
        new Promise<string>(resolve => resolve(`fake status done for ${text}`)),
      setRemoteDevToolsEnabled: enabled =>
        new Promise<string>(resolve => resolve(`dev tools set to ${enabled}`)),
      getRobotServerStatus: () =>
        new Promise<RobotServerServiceStatus>(resolve => resolve('active')),
    }
  }
}
// eslint-disable-next-line import/no-default-export
export default provideExports()

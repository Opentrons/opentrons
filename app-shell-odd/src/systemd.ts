import { platform } from 'process'
import { exec } from 'child_process'
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

interface SDNotify {
  ready: () => Promise<string>
  sendStatus: (text: string) => Promise<string>
}

const provideExports = (): SDNotify => {
  if (platform === 'linux') {
    return {
      ready: () => promisifyProcess('/bin/systemd-notify --ready'),
      sendStatus: text =>
        promisifyProcess(`/bin/systemd-notify --status=${text}`),
    }
  } else {
    return {
      ready: () => {
        return new Promise<string>(resolve => resolve('fake notify done'))
      },
      sendStatus: text => {
        return new Promise<string>(resolve =>
          resolve(`fake status done for ${text}`)
        )
      },
    }
  }
}
// eslint-disable-next-line import/no-default-export
export default provideExports()

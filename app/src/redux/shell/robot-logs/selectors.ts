import type { State } from '../../types'

export function getRobotLogsDownloading(state: State): boolean {
  return state.shell.robotLogs.downloading
}

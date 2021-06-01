export type RobotLogsState = Readonly<{
  downloading: boolean
}>

export type RobotLogsAction =
  | {
      type: 'shell:DOWNLOAD_LOGS'
      payload: { logUrls: string[] }
      meta: { shell: true }
    }
  | { type: 'shell:DOWNLOAD_LOGS_DONE' }

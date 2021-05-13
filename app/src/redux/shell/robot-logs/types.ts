// @flow

export type RobotLogsState = $ReadOnly<{|
  downloading: boolean,
|}>

export type RobotLogsAction =
  | {|
      type: 'shell:DOWNLOAD_LOGS',
      payload: {| logUrls: Array<string> |},
      meta: {| shell: true |},
    |}
  | {| type: 'shell:DOWNLOAD_LOGS_DONE' |}

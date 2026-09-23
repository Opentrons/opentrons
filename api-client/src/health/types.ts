export interface DiskDetails {
  systemAvailableMb: number
  systemTotalMb: number
  imagesDirectorySizeMb: number
  runStartLimitFreeSpaceMb: number
  isDiskSpaceBelowRunStartLimit: boolean
}

export interface Health {
  name: string
  api_version: string
  serial_number: string
  fw_version: string
  board_revision: string
  logs: string[]
  system_version: string
  maximum_protocol_api_version: [major: number, minor: number]
  minimum_protocol_api_version: [major: number, minor: number]
  disk_details: DiskDetails
  links: HealthLinks
}

export interface HealthLinks {
  apiLog: string
  serialLog: string
  serverLog: string
  apiSpec: string
  systemTime: string
}

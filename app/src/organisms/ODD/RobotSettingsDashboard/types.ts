/**
 * a set of screen options for the robot settings dashboard page
 */
export type SettingOption =
  | 'NetworkSettings'
  | 'RobotName'
  | 'RobotSystemVersion'
  | 'TouchscreenSleep'
  | 'TouchscreenBrightness'
  | 'TextSize'
  | 'Privacy'
  | 'DeviceReset'
  | 'UpdateChannel'
  | 'EthernetConnectionDetails'
  | 'RobotSettingsSelectAuthenticationType'
  | 'RobotSettingsJoinOtherNetwork'
  | 'RobotSettingsSetWifiCred'
  | 'RobotSettingsWifi'
  | 'RobotSettingsWifiConnect'
  | 'LanguageSetting'
  | 'CameraPreferences'
  | 'Devices'
  | 'RobotEncryptionKey'
  | 'FileManager'

export type SetSettingOption = (option: SettingOption | null) => void

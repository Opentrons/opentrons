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
  | 'ExternalKeyboardTest' // this is for a testing purpose so will be removed

export type SetSettingOption = (option: SettingOption | null) => void

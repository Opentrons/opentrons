import type { RobotUpdateTarget } from '@opentrons/app/src/redux/robot-update/types'

export interface ReleaseSetUrls {
  fullImage: string
  system: string
  version: string
  releaseNotes: string
}

export interface ReleaseManifest {
  production: {
    [version: string]: ReleaseSetUrls | undefined
  }
}

export interface ReleaseSetFilepaths {
  system: string
  releaseNotes: string
}

type ComponentVersionKind = 'version' | 'sha' | 'branch'

type ReleaseComponent =
  | 'robot_server'
  | 'update_server'
  | 'system_server'
  | 'opentrons_api'
type FlexReleaseComponent =
  | ReleaseComponent
  | 'usb_bridge'
  | 'firmware'
  | 'openembedded'
type OT2ReleaseComponent = ReleaseComponent | 'buildroot'

type FlexReleaseComponentVersions = `${FlexReleaseComponent}_${ComponentVersionKind}`
type OT2ReleaseComponentVersions = `${OT2ReleaseComponent}_${ComponentVersionKind}`
export type OT2VersionInfo = Record<
  'build_type' | OT2ReleaseComponentVersions | 'robot_type',
  string
>
export type FlexVersionInfo = Record<
  'build_type' | FlexReleaseComponentVersions | 'robot_type',
  string
>

export interface OT2UserFileInfo {
  // filepath of update file
  systemFile: string
  // parsed contents of VERSION.json
  versionInfo: OT2VersionInfo
}

export interface FlexUserFileInfo {
  // filepath of update file
  systemFile: string
  // parsed contents of VERSION.json
  versionInfo: FlexVersionInfo
}

export type UserFileInfo = OT2UserFileInfo | FlexUserFileInfo

export type UpdateManifestUrls = Record<RobotUpdateTarget, string>

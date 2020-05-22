// @flow
import type {
  ConfigV0,
  ConfigV1,
  ConfigIntermediateV0ToV1,
} from './ConfigTypes'

export type UrlProtocol = 'file:' | 'http:'

export type UpdateChannel = 'latest' | 'beta' | 'alpha'

export type DiscoveryCandidates = string | Array<string>

export type DevInternalFlag =
  | 'allPipetteConfig'
  | 'enableBundleUpload'
  | 'enableRobotCalCheck'

export type FeatureFlags = $Shape<{|
  [DevInternalFlag]: boolean | void,
|}>

export type UpdateConfigAction = {|
  type: 'config:UPDATE',
  payload: {| path: string, value: any |},
  meta: {| shell: true |},
|}

export type ResetConfigAction = {|
  type: 'config:RESET',
  payload: {| path: string |},
  meta: {| shell: true |},
|}

export type SetConfigAction = {|
  type: 'config:SET',
  payload: {|
    path: string,
    value: any,
  |},
|}

export type Config = ConfigV0 | ConfigV1 | ConfigIntermediateV0ToV1

export type ConfigAction =
  | UpdateConfigAction
  | ResetConfigAction
  | SetConfigAction

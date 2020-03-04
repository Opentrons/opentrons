// @flow
import type { WifiNetwork } from '../../../networking/types'
import typeof { CONNECT, DISCONNECT, JOIN_OTHER } from './constants'

export type {
  WifiNetwork,
  WifiConfigureRequest,
} from '../../../networking/types'

export type NetworkChangeType = CONNECT | DISCONNECT | JOIN_OTHER

export type NetworkChangeState =
  | {| type: CONNECT, ssid: string, network: WifiNetwork |}
  | {| type: DISCONNECT, ssid: string |}
  | {| type: JOIN_OTHER, ssid: string | null |}
  | {| type: null |}

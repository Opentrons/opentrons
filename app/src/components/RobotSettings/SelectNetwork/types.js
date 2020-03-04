// @flow
import type { WifiNetwork } from '../../../networking/types'
import typeof { CONNECT, DISCONNECT, JOIN_OTHER } from './constants'

export type NetworkingActionType = CONNECT | DISCONNECT | JOIN_OTHER | null

export type NetworkingAction =
  | {| type: CONNECT, network: WifiNetwork |}
  | {| type: DISCONNECT, ssid: string |}
  | {| type: JOIN_OTHER |}
  | {| type: null |}

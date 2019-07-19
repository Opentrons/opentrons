// flow-typed signature: b94888d589b0e3e3328d59cd3c829533
// flow-typed version: <<STUB>>/connected-react-router_v^6.4.0/flow_v0.97.0

declare module 'connected-react-router' {
  declare export type RouterActionType = 'POP' | 'PUSH' | 'REPLACE'

  declare export type Location = {|
    hash: string,
    pathname: string,
    search: string,
  |}

  declare export type LocationShape = $Shape<Location>

  declare export type RouterState = {|
    location: Location,
    action: RouterActionType,
  |}

  // action types
  declare export type LocationChangeAction = {|
    type: '@@router/LOCATION_CHANGE',
    payload: {|
      ...RouterState,
      isFirstRendering: boolean,
    |},
  |}

  declare export type CallHistoryMethodAction = {|
    type: '@@router/CALL_HISTORY_METHOD',
    payload: {|
      method: 'push' | 'replace' | 'go' | 'goBack' | 'goForward',
      args: Array<any>,
    |},
  |}

  declare export type RouterAction =
    | LocationChangeAction
    | CallHistoryMethodAction

  declare export function connectRouter<H, A = LocationChangeAction>(
    history: H
  ): (RouterState | void, A) => RouterState

  declare export function push(
    path: string,
    state?: any
  ): CallHistoryMethodAction

  declare export function push(location: LocationShape): CallHistoryMethodAction

  declare export function replace(
    path: string,
    state?: any
  ): CallHistoryMethodAction

  declare export function replace(
    location: LocationShape
  ): CallHistoryMethodAction

  declare export function go(n: number): CallHistoryMethodAction
  declare export function goBack(): CallHistoryMethodAction
  declare export function goForward(): CallHistoryMethodAction
}

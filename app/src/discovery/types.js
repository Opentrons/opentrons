// @flow
export type Connection = {
  ip: string,
  port: number,
  local: boolean,
  ok: ?boolean,
}

export type DiscoveredRobot = {
  name: string,
  connections: Array<Connection>,
}

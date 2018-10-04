// @flow
import type {Service} from '@opentrons/discovery-client'

export type Connection = Service & {local: boolean}

export type DiscoveredRobot = {
  name: string,
  connections: Array<Connection>,
}

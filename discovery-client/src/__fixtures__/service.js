// @flow
import type { Service } from '../types'

export const MOCK_SERVICE: Service = {
  name: 'opentrons-dev',
  ip: '192.168.1.42',
  port: 31950,
  local: false,
  ok: null,
  serverOk: null,
  advertising: null,
  health: null,
  serverHealth: null,
}

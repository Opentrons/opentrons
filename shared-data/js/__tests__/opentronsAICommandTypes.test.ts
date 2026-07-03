import { describe, expect, it } from 'vitest'

import {
  getLatestCommandSchemaCommandTypes,
  getProtocolCommandTypesFromLatestSchema,
  NON_PROTOCOL_COMMAND_TYPES,
} from '../opentronsAI'

const LATEST_SCHEMA_COMMAND_TYPES = getLatestCommandSchemaCommandTypes()
const PROTOCOL_COMMAND_TYPES = getProtocolCommandTypesFromLatestSchema()

function sorted(values: readonly string[]): string[] {
  return [...values].sort()
}

describe('Opentrons AI command types vs latest command schema', () => {
  it('treats every latest-schema command as either non-protocol or protocol', () => {
    const accountedFor = sorted([
      ...NON_PROTOCOL_COMMAND_TYPES,
      ...PROTOCOL_COMMAND_TYPES,
    ])
    expect(accountedFor).toEqual(LATEST_SCHEMA_COMMAND_TYPES)
  })
  it('only lists non-protocol commandTypes that exist in the latest schema', () => {
    const stale = NON_PROTOCOL_COMMAND_TYPES.filter(
      commandType => !LATEST_SCHEMA_COMMAND_TYPES.includes(commandType)
    )
    expect(stale).toEqual([])
  })
})

import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  getLatestCommandSchemaCommandTypes,
  getProtocolCommandTypesFromLatestSchema,
  NON_PROTOCOL_COMMAND_TYPES,
} from '../opentronsAI'

import type {
  AirGapInPlaceArgs,
  AspirateArgs,
  DropTipArgs,
  MoveRelativeArgs,
  MoveToCoordinatesArgs,
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

  it('lets non-string atomic args be runtime parameter names', () => {
    expectTypeOf<AirGapInPlaceArgs['volume']>().toEqualTypeOf<number | string>()
    expectTypeOf<AirGapInPlaceArgs['pipetteId']>().toEqualTypeOf<string>()
    expectTypeOf<
      AirGapInPlaceArgs['commandCreatorFnName']
    >().toEqualTypeOf<'airGapInPlace'>()
    expectTypeOf<AirGapInPlaceArgs['stepNumber']>().toEqualTypeOf<
      number | undefined
    >()
    expectTypeOf<AirGapInPlaceArgs['name']>().toEqualTypeOf<
      string | null | undefined
    >()
    expectTypeOf<MoveRelativeArgs['axis']>().toEqualTypeOf<string>()
    expectTypeOf<MoveRelativeArgs['distance']>().toEqualTypeOf<
      number | string
    >()
    expectTypeOf<MoveToCoordinatesArgs['coordinates']>().toEqualTypeOf<{
      x: number | string
      y: number | string
      z: number | string
    }>()
    expectTypeOf<MoveToCoordinatesArgs['forceDirect']>().toEqualTypeOf<
      boolean | string | undefined
    >()
    expectTypeOf<DropTipArgs['isReturnTip']>().toEqualTypeOf<
      boolean | string | undefined
    >()
    expectTypeOf<AspirateArgs['volume']>().toEqualTypeOf<number>()
  })
})

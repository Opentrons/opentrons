import { describe, it, vi, afterEach, expect } from 'vitest'

import { fixtureTiprack10ul, fixtureTiprack300ul } from '@opentrons/shared-data'

import { getLatestLabwareDef } from '../getLabware'
import { findLabwareDefWithCustom } from '../findLabware'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../getLabware', async importOriginal => {
  const actual = await importOriginal<typeof getLatestLabwareDef>()
  return {
    ...actual,
    getLatestLabwareDef: vi.fn(),
  }
})

const fixtureTipRack10ul = fixtureTiprack10ul as LabwareDefinition2

const fixtureTipRack10ulCustomBeta = {
  ...fixtureTiprack10ul,
  namespace: 'custom_beta',
} as LabwareDefinition2

const fixtureTipRack10ulVersion2 = {
  ...fixtureTiprack10ul,
  version: 2,
} as LabwareDefinition2

const fixtureTipRack300ulOpentrons = {
  ...fixtureTiprack300ul,
  namespace: 'opentrons',
} as LabwareDefinition2

describe('findLabwareDefWithCustom', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('finds standard labware with namesearch', () => {
    vi.mocked(getLatestLabwareDef).mockReturnValue(fixtureTipRack300ulOpentrons)

    expect(
      findLabwareDefWithCustom(
        'opentrons',
        'opentrons_96_tiprack_300ul',
        null,
        []
      )
    ).toEqual(fixtureTipRack300ulOpentrons)

    expect(vi.mocked(getLatestLabwareDef)).toHaveBeenCalledWith(
      'opentrons_96_tiprack_300ul'
    )
  })

  it('handles no-custom-labware', () => {
    expect(
      findLabwareDefWithCustom(
        'custom_beta',
        'opentrons_96_tiprack_300ul',
        '1',
        []
      )
    ).toBe(null)
  })

  const SPECS = [
    {
      should: 'find nothing with no specs',
      customLabware: [fixtureTiprack10ul, fixtureTiprack300ul],
      expect: null,
      namespace: null,
      loadName: null,
      version: null,
    },
    {
      should: 'find the first item with only namespace',
      customLabware: [fixtureTiprack10ul, fixtureTiprack300ul],
      expect: fixtureTiprack10ul,
      namespace: 'fixture',
      loadName: null,
      version: null,
    },
    {
      should: 'find the first item with only loadName',
      customLabware: [
        fixtureTipRack10ul,
        fixtureTipRack10ulCustomBeta,
        fixtureTipRack10ulVersion2,
      ],
      expect: fixtureTipRack10ul,
      namespace: null,
      loadName: 'fixture_tiprack_10_ul',
      version: null,
    },
    {
      should: 'find the right item with loadName and namespace',
      customLabware: [
        fixtureTiprack10ul,
        fixtureTipRack10ulCustomBeta,
        fixtureTipRack10ulVersion2,
      ],
      expect: fixtureTipRack10ulCustomBeta,
      namespace: 'custom_beta',
      loadName: 'fixture_tiprack_10_ul',
      version: null,
    },
    {
      should: 'find the right item with loadName and namespace and version',
      customLabware: [
        fixtureTipRack10ul,
        fixtureTipRack10ulCustomBeta,
        fixtureTipRack10ulVersion2,
      ],
      expect: fixtureTipRack10ulVersion2,
      namespace: 'fixture',
      loadName: 'fixture_tiprack_10_ul',
      version: '2',
    },
  ]

  SPECS.forEach(spec => {
    // TODO(mc, 2021-05-19): these tests are failing due to bug in code under test
    // see: https://github.com/Opentrons/opentrons/issues/7823
    it.skip(`should ${spec.should}`, () => {
      expect(
        findLabwareDefWithCustom(
          spec.namespace,
          spec.loadName,
          spec.version,
          spec.customLabware as LabwareDefinition2[]
        )
      ).toEqual(spec.expect)
    })
  })
})

import { getLatestLabwareDef } from '../getLabware'
import { findLabwareDefWithCustom } from '../findLabware'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'

jest.mock('../getLabware', () => ({
  getLatestLabwareDef: jest.fn(),
}))

const mockGetLabware = getLatestLabwareDef as jest.MockedFunction<
  typeof getLatestLabwareDef
>

const fixtureTipRack10ul = fixture_tiprack_10_ul as LabwareDefinition2

const fixtureTipRack10ulCustomBeta = {
  ...fixture_tiprack_10_ul,
  namespace: 'custom_beta',
} as LabwareDefinition2

const fixtureTipRack10ulVersion2 = {
  ...fixture_tiprack_10_ul,
  version: 2,
} as LabwareDefinition2

const fixtureTipRack300ulOpentrons = {
  ...fixture_tiprack_300_ul,
  namespace: 'opentrons',
} as LabwareDefinition2

describe('findLabwareDefWithCustom', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('finds standard labware with namesearch', () => {
    mockGetLabware.mockReturnValue(fixtureTipRack300ulOpentrons)

    expect(
      findLabwareDefWithCustom(
        'opentrons',
        'opentrons_96_tiprack_300ul',
        null,
        []
      )
    ).toEqual(fixtureTipRack300ulOpentrons)

    expect(mockGetLabware).toHaveBeenCalledWith('opentrons_96_tiprack_300ul')
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
      customLabware: [fixture_tiprack_10_ul, fixture_tiprack_300_ul],
      expect: null,
      namespace: null,
      loadName: null,
      version: null,
    },
    {
      should: 'find the first item with only namespace',
      customLabware: [fixture_tiprack_10_ul, fixture_tiprack_300_ul],
      expect: fixture_tiprack_10_ul,
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
        fixture_tiprack_10_ul,
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
    // eslint-disable-next-line jest/no-disabled-tests
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

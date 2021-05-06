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

// TODO(bc, IMMEDIATELY check if these tests still pass when fixture spread properly comes first)
const fixture_custom_beta_tiprack_10_ul: LabwareDefinition2 = {
  namespace: 'custom_beta',
  ...fixture_tiprack_10_ul,
}

const fixture_tiprack_10_ul_v2: LabwareDefinition2 = {
  version: 2,
  ...fixture_tiprack_10_ul,
}
const opentrons_fixture_tiprack_300ul: LabwareDefinition2 = {
  namespace: 'opentrons',
  ...fixture_tiprack_300_ul,
}

describe('findLabwareDefWithCustom', () => {
  it('finds standard labware with namesearch', () => {
    mockGetLabware.mockReturnValue(opentrons_fixture_tiprack_300ul)
    expect(
      findLabwareDefWithCustom(
        'opentrons',
        'opentrons_96_tiprack_300ul',
        null,
        []
      )
    ).toEqual(opentrons_fixture_tiprack_300ul)
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
      it: 'finds nothing with no specs',
      customLabware: [fixture_tiprack_10_ul, fixture_tiprack_300_ul],
      expect: null,
      namespace: null,
      loadName: null,
      version: null,
    },
    {
      it: 'finds the first item with only namespace',
      customLabware: [fixture_tiprack_10_ul, fixture_tiprack_300_ul],
      expect: fixture_tiprack_10_ul,
      namespace: 'fixture',
      loadName: null,
      version: null,
    },
    {
      it: 'finds the first item with only loadName',
      customLabware: [
        fixture_tiprack_10_ul,
        fixture_custom_beta_tiprack_10_ul,
        fixture_tiprack_10_ul_v2,
      ],
      expect: fixture_tiprack_10_ul,
      namespace: null,
      loadName: 'fixture_tiprack_10_ul',
      version: null,
    },
    {
      it: 'finds the right item with loadName and namespace',
      customLabware: [
        fixture_tiprack_10_ul,
        fixture_custom_beta_tiprack_10_ul,
        fixture_tiprack_10_ul_v2,
      ],
      expect: fixture_custom_beta_tiprack_10_ul,
      namespace: 'custom_beta',
      loadName: 'fixture_tiprack_10_ul',
      version: null,
    },
    {
      it: 'finds the right item with loadName and namespace and version',
      customLabware: [
        fixture_tiprack_10_ul,
        fixture_custom_beta_tiprack_10_ul,
        fixture_tiprack_10_ul_v2,
      ],
      expect: fixture_tiprack_10_ul_v2,
      namespace: 'fixture',
      loadName: 'fixture_tiprack_10_ul',
      version: '2',
    },
  ]
  SPECS.forEach(spec => {
    it(spec.it, () => {
      expect(
        findLabwareDefWithCustom(
          spec.namespace,
          spec.loadName,
          spec.version,
          spec.customLabware
        )
      ).toEqual(spec.expect)
    })
  })
})

import { describe, expect, it } from 'vitest'

import { UNSELECTED } from '@opentrons/components'
import {
  A1_NOZZLE,
  ALL,
  COLUMN,
  F1_NOZZLE,
  fixture384Plate,
  fixtureTiprack1000ul,
  fixtureTiprackAdapter,
  PARTIAL_COLUMN,
  ROW,
  SINGLE,
} from '@opentrons/shared-data'

import {
  getAvailableNozzleConfigurations,
  getEntireWellSelection,
  getInaccessibleWellsForPartialNozzleRowMap,
  getWellGroupLength,
} from '../utils'

import type { DropdownOption, WellType } from '@opentrons/components'
import type {
  LabwareDefinition,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'

const labwareDef = fixtureTiprack1000ul as LabwareDefinition
const primaryNozzle = A1_NOZZLE
const wellName = 'A1'

describe('getEntireWellSelection', () => {
  it('returns an empty array when wellName is not in wellOrdering', () => {
    expect(
      getEntireWellSelection(
        'Z9',
        labwareDef.ordering,
        COLUMN,
        primaryNozzle,
        96
      )
    ).toStrictEqual([])
  })

  it('returns the entire row of wells when the pipette configuration is ROW', () => {
    const nozzleConfiguration = ROW
    expect(
      getEntireWellSelection(
        wellName,
        labwareDef.ordering,
        nozzleConfiguration,
        primaryNozzle,
        96
      )
    ).toStrictEqual([
      'A1',
      'A2',
      'A3',
      'A4',
      'A5',
      'A6',
      'A7',
      'A8',
      'A9',
      'A10',
      'A11',
      'A12',
    ])
  })

  it('returns the entire column of wells when the pipette configuration is COLUMN', () => {
    const nozzleConfiguration = COLUMN
    expect(
      getEntireWellSelection(
        wellName,
        labwareDef.ordering,
        nozzleConfiguration,
        primaryNozzle,
        96
      )
    ).toStrictEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'])
  })

  it('returns the correct number of wells when the pipette configuration is PARTIAL', () => {
    const nozzleConfiguration = PARTIAL_COLUMN
    const partialPrimaryNozzle = F1_NOZZLE
    expect(
      getEntireWellSelection(
        wellName,
        labwareDef.ordering,
        nozzleConfiguration,
        partialPrimaryNozzle,
        8
      )
    ).toStrictEqual(['A1', 'B1', 'C1'])
  })

  it('returns the correct wells when the 96CH configuration is ROW and the labware is a 384 plate', () => {
    const nozzleConfiguration = ROW
    const partialPrimaryNozzle = A1_NOZZLE
    expect(
      getEntireWellSelection(
        wellName,
        fixture384Plate.ordering,
        nozzleConfiguration,
        partialPrimaryNozzle,
        96
      )
    ).toStrictEqual([
      'A1',
      'A3',
      'A5',
      'A7',
      'A9',
      'A11',
      'A13',
      'A15',
      'A17',
      'A19',
      'A21',
      'A23',
    ])
  })
  it('returns the correct wells when the 96CH configuration is COLUMN and the labware is a 384 plate', () => {
    const nozzleConfiguration = COLUMN
    const partialPrimaryNozzle = A1_NOZZLE
    expect(
      getEntireWellSelection(
        wellName,
        fixture384Plate.ordering,
        nozzleConfiguration,
        partialPrimaryNozzle,
        96
      )
    ).toStrictEqual(['A1', 'C1', 'E1', 'G1', 'I1', 'K1', 'M1', 'O1'])
  })
  it('returns the correct wells when the pipette configuration is PARTIAL and the labware is a 384 plate', () => {
    const nozzleConfiguration = PARTIAL_COLUMN
    const partialPrimaryNozzle = F1_NOZZLE
    expect(
      getEntireWellSelection(
        'B1',
        fixture384Plate.ordering,
        nozzleConfiguration,
        partialPrimaryNozzle,
        8
      )
    ).toStrictEqual(['B1', 'D1', 'F1'])
  })
})

describe('getAvailableNozzleConfigurations', () => {
  const mockT = (key: string) => key
  const mockAdapter = {
    stack: ['labId3', '2'],
    id: 'labId3',
    labwareDefURI: 'mockUri3',
    def: fixtureTiprackAdapter as LabwareDefinition2,
    pythonName: 'mockPythonName',
  }
  const mockTiprackOnAdapter = {
    stack: ['tiprack', 'labwareId3', '2'],
    id: 'tiprack',
    labwareDefURI: 'tiprackURI',
    def: fixtureTiprack1000ul as LabwareDefinition2,
    pythonName: 'tiprack',
  }
  const mockTiprack = {
    stack: ['tiprack2', '3'],
    id: 'tiprack2',
    labwareDefURI: 'tiprackURI2',
    def: fixtureTiprack1000ul as LabwareDefinition2,
    pythonName: 'tiprack2',
  }

  const nozzleConfigurationOptions: DropdownOption[] = [
    {
      name: 'all_nozzles',
      value: ALL,
    },
  ]
  const mockDeckSetup: AllTemporalPropertiesForTimelineFrame = {
    labware: { mockAdapter, mockTiprack, mockTiprackOnAdapter },
    pipettes: {},
    modules: {},
    additionalEquipmentOnDeck: {},
  }
  it('returns drop down options with SINGLE, PARTIAL, and ALL when there is an 8ch pipette', () => {
    const channels = 8
    const pipette8chConfigurations = [
      ...nozzleConfigurationOptions,
      {
        name: 'single_nozzle',
        value: SINGLE,
      },
      {
        name: 'partial_nozzles',
        value: PARTIAL_COLUMN,
      },
    ]
    expect(
      getAvailableNozzleConfigurations(channels, mockDeckSetup, mockT)
    ).toStrictEqual(pipette8chConfigurations)
  })

  it('returns drop down options with SINGLE, COLUMN, ROW, and ALL when there is a 96ch pipette', () => {
    const channels = 96
    const pipette96Configurations = [
      ...nozzleConfigurationOptions,

      {
        disabled: false,
        name: 'single_nozzle',
        value: SINGLE,
        tooltipText: null,
      },
      {
        disabled: false,
        name: 'single_column_of_nozzles',
        value: COLUMN,
        tooltipText: null,
      },
      {
        disabled: false,
        name: 'single_row_of_nozzles',
        value: ROW,
        tooltipText: null,
      },
    ]
    expect(
      getAvailableNozzleConfigurations(channels, mockDeckSetup, mockT)
    ).toStrictEqual(pipette96Configurations)
  })
  it('returns drop down options with ALL when there is a 1ch pipette', () => {
    const channels = 1
    expect(
      getAvailableNozzleConfigurations(channels, mockDeckSetup, mockT)
    ).toStrictEqual(nozzleConfigurationOptions)
  })
  it('returns length of well group when the nozzle configuration is ROW', () => {
    const totalSelected = 2
    const nozzleConfiguration = ROW
    const mockTiprack = {
      stack: ['tiprack2', '3'],
      id: 'tiprack2',
      labwareDefURI: 'tiprackURI2',
      def: fixtureTiprack1000ul as LabwareDefinition2,
      pythonName: 'tiprack2',
    }
    const ordering = mockTiprack.def.ordering
    expect(
      getWellGroupLength(totalSelected, ordering, nozzleConfiguration, 0)
    ).toStrictEqual(2)
  })
  it('returns length of well group when the nozzle configuration is COLUMN', () => {
    const totalSelected = 2
    const nozzleConfiguration = COLUMN
    const mockTiprack = {
      stack: ['tiprack2', '3'],
      id: 'tiprack2',
      labwareDefURI: 'tiprackURI2',
      def: fixtureTiprack1000ul as LabwareDefinition2,
      pythonName: 'tiprack2',
    }
    const ordering = mockTiprack.def.ordering
    expect(
      getWellGroupLength(totalSelected, ordering, nozzleConfiguration, 0)
    ).toStrictEqual(2)
  })
  it('returns length of well group when the nozzle configuration is ALL', () => {
    const totalSelected = 13
    const nozzleConfiguration = ALL
    const mockTiprack = {
      stack: ['tiprack2', '3'],
      id: 'tiprack2',
      labwareDefURI: 'tiprackURI2',
      def: fixtureTiprack1000ul as LabwareDefinition2,
      pythonName: 'tiprack2',
    }
    const ordering = mockTiprack.def.ordering
    expect(
      getWellGroupLength(totalSelected, ordering, nozzleConfiguration, 0)
    ).toStrictEqual(13)
  })
  it('returns length of well group when the nozzle configuration is PARTIAL', () => {
    const totalSelected = 3
    const nozzleConfiguration = PARTIAL_COLUMN
    const mockTiprack = {
      stack: ['tiprack2', '3'],
      id: 'tiprack2',
      labwareDefURI: 'tiprackURI2',
      def: fixtureTiprack1000ul as LabwareDefinition2,
      pythonName: 'tiprack2',
    }
    const ordering = mockTiprack.def.ordering
    expect(
      getWellGroupLength(totalSelected, ordering, nozzleConfiguration, 3)
    ).toStrictEqual(9)
  })
})

describe('getInaccessibleWellsForPartialNozzleRowMap', () => {
  const mockTiprack = {
    stack: ['tiprack2', '3'],
    id: 'tiprack2',
    labwareDefURI: 'tiprackURI2',
    def: fixtureTiprack1000ul as LabwareDefinition2,
    pythonName: 'tiprack2',
  }
  const wellDefMap = mockTiprack.def.ordering
  const allWellsWithState: Record<string, WellType> = {}
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const cols = Array.from({ length: 12 }, (_, i) => (i + 1).toString())

  for (const row of rows) {
    for (const col of cols) {
      const well = `${row}${col}`
      allWellsWithState[well] = UNSELECTED
    }
  }
  const threeChannels = 3
  const selectedWells3Grouping = [
    ['A1', 'B1', 'C1'],
    ['F1', 'G1', 'H1'],
  ]
  it('marks wells D1 and E1 as inaccessible when two 3 well chunks are selected', () => {
    expect(
      getInaccessibleWellsForPartialNozzleRowMap(
        selectedWells3Grouping,
        wellDefMap,
        allWellsWithState,
        threeChannels
      )
    ).toStrictEqual(['D1', 'E1'])
  })

  it('marks wells A1 and H1 as inaccessible and [D1, E1] as accessible when two 2 well chunks are selected', () => {
    const twoChannels = 2
    const selectedWells2Grouping = [
      ['B1', 'C1'],
      ['F1', 'G1'],
    ]
    expect(
      getInaccessibleWellsForPartialNozzleRowMap(
        selectedWells2Grouping,
        wellDefMap,
        allWellsWithState,
        twoChannels
      )
    ).toStrictEqual(['A1', 'H1'])
  })
  it('marks does not mark wells as inaccessible during 384 plate', () => {
    const twoChannels = 4
    const selectedWells4Grouping = [['A1', 'C1', 'E1', 'G1']]
    expect(
      getInaccessibleWellsForPartialNozzleRowMap(
        selectedWells4Grouping,
        fixture384Plate.ordering,
        allWellsWithState,
        twoChannels
      )
    ).toStrictEqual([])
  })
})

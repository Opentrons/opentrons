import { describe, expect, it } from 'vitest'

import {
  A1_NOZZLE,
  ALL,
  COLUMN,
  F1_NOZZLE,
  fixtureTiprack1000ul,
  fixtureTiprackAdapter,
  PARTIAL,
  ROW,
  SINGLE,
} from '@opentrons/shared-data'

import {
  getAvailableNozzleConfigurations,
  getEntireWellSelection,
} from '../utils'

import type { DropdownOption } from '@opentrons/components'
import type {
  LabwareDefinition,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'

const labwareDef = fixtureTiprack1000ul as LabwareDefinition
const primaryNozzle = A1_NOZZLE
const wellName = 'A1'

describe('getEntireWellSelection', () => {
  it('returns the entire row of wells when the pipette configuration is ROW', () => {
    const nozzleConfiguration = ROW
    expect(
      getEntireWellSelection(
        wellName,
        labwareDef,
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
        labwareDef,
        nozzleConfiguration,
        primaryNozzle,
        96
      )
    ).toStrictEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1'])
  })

  it('returns the correct number of wells when the pipette configuration is PARTIAL', () => {
    const nozzleConfiguration = PARTIAL
    const partialPrimaryNozzle = F1_NOZZLE
    expect(
      getEntireWellSelection(
        wellName,
        labwareDef,
        nozzleConfiguration,
        partialPrimaryNozzle,
        8
      )
    ).toStrictEqual(['A1', 'B1', 'C1'])
  })

  it('returns an error if there are not enough wells to select when the pipette configuration is PARTIAL', () => {
    const nozzleConfiguration = PARTIAL
    const partialPrimaryNozzle = F1_NOZZLE
    const wellName = 'H12'
    expect(
      getEntireWellSelection(
        wellName,
        labwareDef,
        nozzleConfiguration,
        partialPrimaryNozzle,
        8
      )
    ).toStrictEqual([])
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
        value: PARTIAL,
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
})

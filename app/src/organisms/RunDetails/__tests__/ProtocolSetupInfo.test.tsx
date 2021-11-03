import * as React from 'react'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import { i18n } from '../../../i18n'
import { ProtocolSetupInfo } from '../ProtocolSetupInfo'
import type { Command, LabwareDefinition2 } from '@opentrons/shared-data'

const LABWARE_LOCATION = { slotName: '9' } || { moduleId: null } || {
    coordinates: { x: 0, y: 0, z: 0 },
  }
const LABWARE_LOCATION_WITH_MODULE = { slotName: '9' } || {
    moduleId: 'temperature_module',
  } || {
    coordinates: { x: 0, y: 0, z: 0 },
  }
const MODULE_LOCATION = { slotName: '9' } || {
  coordinates: { x: 0, y: 0, z: 0 },
}

const COMMAND_TYPE_LOAD_LABWARE = {
  commandType: 'loadLabware',
  params: {
    labwareId: '96_wellplate',
    location: LABWARE_LOCATION,
  },
  result: {
    labwareId: '96_wellplate',
    definition: fixture_96_plate as LabwareDefinition2,
    offset: { x: 0, y: 0, z: 0 },
  },
} as Command
const COMMAND_TYPE_LOAD_LABWARE_WITH_MODULE = {
  commandType: 'loadLabware',
  params: {
    labwareId: '96_wellplate',
    location: LABWARE_LOCATION_WITH_MODULE,
  },
  result: {
    labwareId: '96_wellplate',
    definition: fixture_96_plate as LabwareDefinition2,
    offset: { x: 0, y: 0, z: 0 },
  },
} as Command
const COMMAND_TYPE_LOAD_MODULE = {
  commandType: 'loadModule',
  params: {
    moduleId: 'temperature_module_gen2',
    location: MODULE_LOCATION,
  },
  result: {
    moduleId: 'temperature_module_gen2',
  },
} as Command
const COMMAND_TYPE_LOAD_MODULE_TC = {
  commandType: 'loadModule',
  params: {
    moduleId: 'thermocycler',
    location: MODULE_LOCATION,
  },
  result: {
    moduleId: 'thermocycler',
  },
} as Command
const COMMAND_TYPE_LOAD_PIPETTE = {
  commandType: 'loadPipette',
  params: {
    pipetteId: '300uL_multichannel',
    mount: 'left',
  },
  result: {
    pipetteId: '300uL_multichannel',
  },
} as Command

const render = (props: React.ComponentProps<typeof ProtocolSetupInfo>) => {
  return renderWithProviders(<ProtocolSetupInfo {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ProtocolSetupInfo', () => {
  let props: React.ComponentProps<typeof ProtocolSetupInfo>
  beforeEach(() => {
    props = { onCloseClick: jest.fn(), SetupCommand: COMMAND_TYPE_LOAD_LABWARE }
  })
  it('should render correct Protocol Setup text', () => {
    const { getByText } = render(props)
    getByText('Protocol Setup')
  })

  it('should render correct command when commandType is loadLabware', () => {
    const { getByText } = render(props)
    getByText(
      'Load ANSI 96 Standard Microplate v1 in temperature_module in Slot 9'
    )
  })
  it('should render correct command when commandType is loadLabware on top of a module', () => {
    props = {
      onCloseClick: jest.fn(),
      SetupCommand: COMMAND_TYPE_LOAD_LABWARE_WITH_MODULE,
    }
    const { getByText } = render(props)
    getByText('Load ANSI 96 Standard Microplate v1 in Slot 9')
  })
  it('should render correct command when commandType is loadPipette', () => {
    props = { onCloseClick: jest.fn(), SetupCommand: COMMAND_TYPE_LOAD_PIPETTE }
    const { getByText } = render(props)
    getByText(nestedTextMatcher('Load 300uL_multichannel in left Mount'))
  })
  it('should render correct command when commandType is loadModule', () => {
    props = { onCloseClick: jest.fn(), SetupCommand: COMMAND_TYPE_LOAD_MODULE }
    const { getByText } = render(props)
    getByText('Load temperature_module_gen2 in Slot 9')
  })
  it('should render correct command when commandType is loadModule and a TC is used', () => {
    props = {
      onCloseClick: jest.fn(),
      SetupCommand: COMMAND_TYPE_LOAD_MODULE_TC,
    }
    const { getByText } = render(props)
    getByText('Load thermocycler')
  })
})

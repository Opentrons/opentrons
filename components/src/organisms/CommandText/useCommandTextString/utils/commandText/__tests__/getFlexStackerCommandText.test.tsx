import { useTranslation } from 'react-i18next'
import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { getLabwareDefURI } from '@opentrons/shared-data'

import { i18n } from '../../../../../../i18n'
import { renderWithProviders } from '../../../../../../testing/utils'
import { getLabwareDisplayLocation } from '../../getLabwareDisplayLocation'
import {
  getFlexStackerCommandText,
  KEYS_BY_COMMAND_TYPE,
} from '../getFlexStackerCommandText'

vi.mock('@opentrons/shared-data')
vi.mock('../../getLabwareDisplayLocation')

const baseCommandData = {
  allRunDefs: [
    { metadata: { displayName: 'tip rack' } },
    { metadata: { displayName: 'plate' } },
  ],
  robotType: 'OT-2',
  commandTextData: {
    commands: [],
    labware: [],
    modules: [],
    pipettes: [{ id: 'pipette-1', pipetteName: 'p300_single' }],
  },
} as any

function TestWrapper({ command }: { command: any }): JSX.Element {
  const { t } = useTranslation(['protocol_command_text', 'branded'])
  const text = getFlexStackerCommandText({
    command,
    ...baseCommandData,
    t,
  })

  return <div>{text}</div>
}

const render = (command: any) => {
  return renderWithProviders(<TestWrapper command={command} />, {
    i18nInstance: i18n,
  })
}

describe('getPipettingCommandText', () => {
  beforeEach(() => {
    vi.mocked(getLabwareDefURI).mockReturnValue('tiprack-uri')
    vi.mocked(getLabwareDisplayLocation).mockReturnValue('Slot 1')
  })

  it('should render retrieve command text correctly', () => {
    const command = {
      id: 'cmd-1',
      commandType: 'flexStacker/retrieve',
      params: {
        moduleId: 'module-id',
      },
      result: {
        primaryLabwareURI: 'tiprack-uri',
      },
    }

    render(command)
    screen.getByText('retrieve_labware_from_stacker_to')
  })

  it('should render store command text correctly', () => {
    const command = {
      id: 'cmd-1',
      commandType: 'flexStacker/store',
      params: {
        moduleId: 'module-id',
      },
      result: {
        primaryLabwareURI: 'tiprack-uri',
        primaryOriginLocationSequence: [
          { kind: 'onAddressableArea', addressableAreaName: 'A1' },
        ],
      },
    }

    render(command)
    screen.getByText('store_labware_from_slot_to_stacker')
  })

  it('should render setStoredLabwareItems command text correctly', () => {
    const command = {
      id: 'cmd-1',
      commandType: 'flexStacker/setStoredLabwareItems',
      params: {
        moduleId: 'module-id',
        labware: ['plate-1', 'plate-2'],
      },
      result: {
        count: 2,
        primaryLabwareDefinition: {
          metadata: {
            displayName: 'dummy def',
          },
        },
      },
    }

    render(command)
    screen.getByText(
      'flex_stacker_set_stored_labware_with_quantity_and_location'
    )
  })

  it('should render setStoredLabware command text correctly', () => {
    const command = {
      id: 'cmd-1',
      commandType: 'flexStacker/setStoredLabware',
      params: {
        moduleId: 'module-id',
      },
      result: {
        primaryLabwareURI: 'tiprack-uri',
        primaryLabwareDefinition: {
          metadata: {
            displayName: 'dummy def',
          },
        },
        primaryOriginLocationSequence: [
          { kind: 'onAddressableArea', addressableAreaName: 'A1' },
        ],
      },
    }

    render(command)
    screen.getByText(
      'flex_stacker_set_stored_labware_with_quantity_and_location'
    )
  })

  it('should render fillItems command text correctly', () => {
    const command = {
      id: 'cmd-1',
      commandType: 'flexStacker/fillItems',
      params: {
        moduleId: 'module-id',
        labware: ['plate-1', 'plate-2', 'plate-3'],
      },
      result: {
        primaryLabwareURI: 'tiprack-uri',
        addedLabware: [{}, {}, {}],
      },
    }

    render(command)
    screen.getByText('flex_stacker_fill_with_quantity_and_labware')
  })

  it('should render fill command text correctly', () => {
    const command = {
      id: 'cmd-1',
      commandType: 'flexStacker/fill',
      params: {
        moduleId: 'module-id',
      },
      result: {
        primaryLabwareURI: 'tiprack-uri',
        primaryLabwareDefinition: {
          metadata: {
            displayName: 'dummy def',
          },
        },
        primaryOriginLocationSequence: [
          { kind: 'onAddressableArea', addressableAreaName: 'A1' },
        ],
      },
    }

    render(command)
    screen.getByText('flex_stacker_fill_with_quantity_and_labware')
  })

  it('should render empty command text correctly', () => {
    const command = {
      id: 'cmd-1',
      commandType: 'flexStacker/empty',
      params: {
        moduleId: 'module-id',
      },
      result: {
        primaryLabwareURI: 'tiprack-uri',
        primaryLabwareDefinition: {
          metadata: {
            displayName: 'dummy def',
          },
        },
        primaryOriginLocationSequence: [
          { kind: 'onAddressableArea', addressableAreaName: 'A1' },
        ],
      },
    }
    render(command)
    screen.getByText('flex_stacker_empty_from_location')
  })
})

describe.each(Object.entries(KEYS_BY_COMMAND_TYPE))(
  'Default fallback for %s',
  (commandType, expectedKey) => {
    it(`should render default text for ${commandType} when result is missing`, () => {
      const command = {
        id: 'cmd-1',
        commandType: commandType,
        params: {
          moduleId: 'module-id',
        },
      }
      render(command)
      screen.getByText(expectedKey)
    })
  }
)

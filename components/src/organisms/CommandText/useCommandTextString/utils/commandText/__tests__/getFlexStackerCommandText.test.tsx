import { useTranslation } from 'react-i18next'
import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { getLabwareDefURI } from '@opentrons/shared-data'

import { i18n } from '../../../../../../i18n'
import { renderWithProviders } from '../../../../../../testing/utils'
import { getLabwareDisplayLocation } from '../../getLabwareDisplayLocation'
import { getFlexStackerCommandText } from '../getFlexStackerCommandText'

import type { FlexStackerCommand } from '../getFlexStackerCommandText'

vi.mock('@opentrons/shared-data')
vi.mock('../../getLabwareDisplayLocation')

const STRINGS_BY_COMMAND_TYPE: {
  [commandType in FlexStackerCommand['commandType']]: string
} = {
  'flexStacker/retrieve': 'Retrieve from Flex Stacker',
  'flexStacker/store': 'Store into Flex Stacker',
  'flexStacker/setStoredLabware': 'Set stored labware in Flex Stacker',
  'flexStacker/empty': 'Manually empty all labware from Flex Stacker',
  'flexStacker/fill': 'Fill Flex Stacker',
}

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
    screen.getByText('Retrieve tip rack from Flex Stacker to Slot 1')
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
    screen.getByText('Store tip rack from Slot 1 to Flex Stacker')
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
    screen.getByText('Configure Flex Slot 1 with dummy def')
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
    screen.getByText('Fill Flex Slot 1 with tip rack')
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
    screen.getByText('Manually empty all labware from Flex Slot 1')
  })
})

describe.each(Object.entries(STRINGS_BY_COMMAND_TYPE))(
  'Default fallback for %s',
  (commandType, expectedString) => {
    it(`should render default text for ${commandType} when result is missing`, () => {
      const command = {
        id: 'cmd-1',
        commandType: commandType,
        params: {
          moduleId: 'module-id',
        },
      }
      render(command)
      screen.getByText(expectedString)
    })
  }
)

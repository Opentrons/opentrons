import { useTranslation } from 'react-i18next'
import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import {
  FLEX_STACKER_MODULE_V1,
  getModuleDisplayName,
} from '@opentrons/shared-data'

import { i18n } from '../../../../../../i18n'
import { renderWithProviders } from '../../../../../../testing/utils'
import { getModuleDisplayLocation } from '../../getModuleDisplayLocation'
import { getIdentifyModuleCommandText } from '../getIdentifyModuleCommandText'

import type { ReactNode } from 'react'

vi.mock('@opentrons/shared-data')
vi.mock('../../getModuleDisplayLocation')

const baseCommandData = {
  commandTextData: {
    commands: [],
    labware: [],
    modules: [
      {
        id: 'stacker-1',
        model: FLEX_STACKER_MODULE_V1,
        location: { slotName: 'D4' },
      },
    ],
    pipettes: [],
  },
} as any

function TestWrapper({ command }: { command: any }): ReactNode {
  const { t } = useTranslation('protocol_command_text')
  const text = getIdentifyModuleCommandText({
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

describe('getIdentifyModuleCommandText', () => {
  beforeEach(() => {
    vi.mocked(getModuleDisplayName).mockReturnValue('Flex Stacker')
    vi.mocked(getModuleDisplayLocation).mockReturnValue('D4')
  })

  it('should render identifyModule command text when starting with color', () => {
    render({
      id: 'cmd-1',
      commandType: 'identifyModule',
      params: {
        model: FLEX_STACKER_MODULE_V1,
        moduleId: 'stacker-1',
        start: true,
        color: 'blue',
      },
    })

    screen.getByText('Starting identifying Flex Stacker in slot D4 blue')
  })

  it('should render identifyModule command text when stopping without color', () => {
    render({
      id: 'cmd-1',
      commandType: 'identifyModule',
      params: {
        model: FLEX_STACKER_MODULE_V1,
        moduleId: 'stacker-1',
        start: false,
      },
    })

    screen.getByText('Stopping identifying Flex Stacker in slot D4')
  })
})

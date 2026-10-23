import { useTranslation } from 'react-i18next'
import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { i18n } from '../../../../../../i18n'
import { renderWithProviders } from '../../../../../../testing/utils'
import { getLabwareName } from '../../getLabwareName'
import { getTipStateCommandText } from '../getTipStateCommandText'

import type { ReactNode } from 'react'

vi.mock('@opentrons/shared-data')
vi.mock('../../getLabwareName')

const baseCommandData = {
  allRunDefs: {},
  robotType: 'OT-2',
  commandTextData: {
    commands: [],
    labware: [],
    modules: [],
    pipettes: [],
  },
} as any

function TestWrapper({ command }: { command: any }): ReactNode {
  const { t } = useTranslation('protocol_command_text')
  const text = getTipStateCommandText({
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

describe('getTipStateCommandText', () => {
  beforeEach(() => {
    vi.mocked(getLabwareName).mockReturnValue('Test Tiprack')
  })

  it('should render set tip state command text correctly', () => {
    const command = {
      id: 'cmd-1',
      commandType: 'setTipState',
      params: {
        labwareId: 'labware-1',
        wellNames: ['A1', 'A2'],
        tipWellState: 'empty',
      },
    }

    render(command)
    screen.getByText(/Setting tips in Test Tiprack to empty/)
  })
})

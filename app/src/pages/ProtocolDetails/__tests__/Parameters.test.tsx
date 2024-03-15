import * as React from 'react'
import { when } from 'vitest-when'
import { it, describe, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { useToaster } from '../../../organisms/ToasterOven'
import { renderWithProviders } from '../../../__testing-utils__'
import { useRunTimeParameters } from '../../Protocols/hooks'
import { Parameters } from '../Parameters'
import type { RunTimeParameter } from '@opentrons/shared-data'

vi.mock('../../../organisms/ToasterOven')
vi.mock('../../Protocols/hooks')

const mockRTPData: RunTimeParameter[] = [
  {
    displayName: 'Dry Run',
    variableName: 'DRYRUN',
    description: 'a dry run description',
    type: 'boolean',
    default: false,
  },
  {
    displayName: 'Use Gripper',
    variableName: 'USE_GRIPPER',
    description: '',
    type: 'boolean',
    default: true,
  },
  {
    displayName: 'Trash Tips',
    variableName: 'TIP_TRASH',
    description: 'throw tip in trash',
    type: 'boolean',
    default: true,
  },
  {
    displayName: 'Deactivate Temperatures',
    variableName: 'DEACTIVATE_TEMP',
    description: 'deactivate temperature?',
    type: 'boolean',
    default: true,
  },
  {
    displayName: 'Columns of Samples',
    variableName: 'COLUMNS',
    description: '',
    suffix: 'mL',
    type: 'int',
    min: 1,
    max: 14,
    default: 4,
  },
  {
    displayName: 'PCR Cycles',
    variableName: 'PCR_CYCLES',
    description: '',
    type: 'int',
    min: 1,
    max: 10,
    default: 6,
  },
  {
    displayName: 'EtoH Volume',
    variableName: 'ETOH_VOLUME',
    description: '',
    type: 'float',
    min: 1.5,
    max: 10.0,
    default: 6.5,
  },
  {
    displayName: 'Default Module Offsets',
    variableName: 'DEFAULT_OFFSETS',
    description: '',
    type: 'str',
    choices: [
      {
        displayName: 'no offsets',
        value: 'none',
      },
      {
        displayName: 'temp offset',
        value: '1',
      },
      {
        displayName: 'heater-shaker offset',
        value: '2',
      },
    ],
    default: 'none',
  },
  {
    displayName: '2 choices',
    variableName: 'TWO',
    description: '',
    type: 'str',
    choices: [
      {
        displayName: 'one choice',
        value: '1',
      },
      {
        displayName: 'the second',
        value: '2',
      },
    ],
    default: '2',
  },
]

const render = (props: React.ComponentProps<typeof Parameters>) => {
  return renderWithProviders(<Parameters {...props} />, {
    i18nInstance: i18n,
  })
}
const MOCK_MAKE_SNACK_BAR = vi.fn()
describe('Parameters', () => {
  let props: React.ComponentProps<typeof Parameters>

  beforeEach(() => {
    props = {
      protocolId: 'mockId',
    }
    when(useToaster)
      .calledWith()
      .thenReturn({
        makeSnackBar: MOCK_MAKE_SNACK_BAR,
      } as any)
    vi.mocked(useRunTimeParameters).mockReturnValue(mockRTPData)
  })
  it('renders the parameters labels and mock data', () => {
    render(props)
    screen.getByText('Name')
    screen.getByText('Default value')
    screen.getByText('Range')
    screen.getByText('Dry Run')
    screen.getByText('6.5')
    screen.getByText('Use Gripper')
    screen.getByText('Default Module Offsets')
    screen.getByText('3 choices')
    screen.getByText('EtoH Volume')
    screen.getByText('one choice, the second')
    screen.getByText('fda')
  })
})

import * as React from 'react'
import { describe, it, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ProtocolParameters } from '../ProtocolParameters'

import type { RunTimeParameter } from '@opentrons/shared-data'

const mockRunTimeParameter: RunTimeParameter[] = [
  {
    displayName: 'Trash Tips',
    variableName: 'TIP_TRASH',
    description:
      'to throw tip into the trash or to not throw tip into the trash',
    type: 'boolean',
    default: true,
  },
  {
    displayName: 'EtoH Volume',
    variableName: 'ETOH_VOLUME',
    description: '70% ethanol volume',
    type: 'float',
    suffix: 'mL',
    min: 1.5,
    max: 10.0,
    default: 6.5,
  },
  {
    displayName: 'Default Module Offsets',
    variableName: 'DEFAULT_OFFSETS',
    description: 'default module offsets for temp, H-S, and none',
    type: 'str',
    choices: [
      {
        displayName: 'No offsets',
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
    displayName: 'pipette mount',
    variableName: 'mont',
    description: 'pipette mount',
    type: 'str',
    choices: [
      {
        displayName: 'Left',
        value: 'left',
      },
      {
        displayName: 'Right',
        value: 'right',
      },
    ],
    default: 'left',
  },
]

const render = (props: React.ComponentProps<typeof ProtocolParameters>) => {
  return renderWithProviders(<ProtocolParameters {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ProtocolParameters', () => {
  let props: React.ComponentProps<typeof ProtocolParameters>

  beforeEach(() => {
    props = {
      runTimeParameters: mockRunTimeParameter,
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render banner when RunTimeParameters are existing', () => {
    render(props)
    screen.getByText('Listed values are view-only')
    screen.getByText('Start setup to customize values')
  })

  it('should render table header', () => {
    render(props)
    screen.getByText('Name')
    screen.getByText('Default Value')
    screen.getByText('Range')
  })

  it('should render parameters default information', () => {
    render(props)
    screen.getByText('Trash Tips')
    screen.getByText('On')
    screen.getByText('On, off')

    screen.getByText('EtoH Volume')
    screen.getByText('6.5')
    screen.getByText('1.5-10')

    screen.getByText('Default Module Offsets')
    screen.getByText('No offsets')
    screen.getByText('Multi')

    screen.getByText('pipette mount')
    screen.getByText('Left')
    screen.getByText('Left, right')
  })

  it('should render empty display when protocol does not have any parameter', () => {
    props = {
      runTimeParameters: [],
    }
    render(props)
    screen.getByText('No parameters specified in this protocol')
  })
})

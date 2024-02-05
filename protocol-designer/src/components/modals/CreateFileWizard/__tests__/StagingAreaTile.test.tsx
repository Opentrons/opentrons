import * as React from 'react'
import { screen } from '@testing-library/react'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'
import { DeckConfigurator } from '@opentrons/components'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../localization'
import { StagingAreaTile } from '../StagingAreaTile'

import type { FormState, WizardTileProps } from '../types'

jest.mock('@opentrons/components/src/hardware-sim/DeckConfigurator/index')

const mockDeckConfigurator = DeckConfigurator as jest.MockedFunction<
  typeof DeckConfigurator
>
const render = (props: React.ComponentProps<typeof StagingAreaTile>) => {
  return renderWithProviders(<StagingAreaTile {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const values = {
  fields: {
    robotType: OT2_ROBOT_TYPE,
  },
  additionalEquipment: ['gripper'],
} as FormState

const mockWizardTileProps: Partial<WizardTileProps> = {
  goBack: jest.fn(),
  proceed: jest.fn(),
  setValue: jest.fn(),
  watch: jest.fn((name: keyof typeof values) => values[name]) as any,
  getValues: jest.fn(() => values) as any,
}

describe('StagingAreaTile', () => {
  let props: React.ComponentProps<typeof StagingAreaTile>

  beforeEach(() => {
    props = {
      ...props,
      ...mockWizardTileProps,
    } as WizardTileProps
    mockDeckConfigurator.mockReturnValue(<div>mock deck configurator</div>)
  })
  it('renders null when robot type is ot-2', () => {
    render(props)
    expect(screen.queryByText('Staging area slots')).not.toBeInTheDocument()
  })
  it('renders header and deck configurator', () => {
    const values = {
      fields: {
        robotType: FLEX_ROBOT_TYPE,
      },
      additionalEquipment: ['gripper'],
    } as FormState

    const mockWizardTileProps: Partial<WizardTileProps> = {
      goBack: jest.fn(),
      proceed: jest.fn(),
      setValue: jest.fn(),
      watch: jest.fn((name: keyof typeof values) => values[name]) as any,
      getValues: jest.fn(() => values) as any,
    }

    props = {
      ...props,
      ...mockWizardTileProps,
    } as WizardTileProps
    render(props)
    screen.getByText('Staging area slots')
    screen.getByText('mock deck configurator')
  })
})

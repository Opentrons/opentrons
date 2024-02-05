import * as React from 'react'
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

const mockWizardTileProps: Partial<WizardTileProps> = {
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  goBack: jest.fn(),
  proceed: jest.fn(),
  setFieldValue: jest.fn(),
  values: {
    fields: {
      robotType: OT2_ROBOT_TYPE,
    },
    additionalEquipment: ['gripper'],
  } as FormState,
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
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })
  it('renders header and deck configurator', () => {
    props.values.fields.robotType = FLEX_ROBOT_TYPE
    const { getByText } = render(props)
    getByText('Staging area slots')
    getByText('mock deck configurator')
  })
})

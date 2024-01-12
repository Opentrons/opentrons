import * as React from 'react'
import i18n from 'i18next'
import { fireEvent, screen } from '@testing-library/react'
import { LEGACY_COLORS, renderWithProviders } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { RobotTypeTile } from '../RobotTypeTile'
import type { FormState, WizardTileProps } from '../types'

const render = (props: React.ComponentProps<typeof RobotTypeTile>) => {
  return renderWithProviders(<RobotTypeTile {...props} />, {
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
      name: 'mockName',
      description: 'mockDescription',
      organizationOrAuthor: 'mockOrganizationOrAuthor',
      robotType: FLEX_ROBOT_TYPE,
    },
  } as FormState,
}

describe('RobotTypeTile', () => {
  let props: React.ComponentProps<typeof RobotTypeTile>

  beforeEach(() => {
    props = {
      ...props,
      ...mockWizardTileProps,
    } as WizardTileProps
  })

  it('renders robot images and clicking on them changing the style', () => {
    render(props)
    screen.getByLabelText('OpentronsFlex.png')
    screen.getByLabelText('OT2.png')
    const flex = screen.getByLabelText('RobotTypeTile_OT-3 Standard')
    fireEvent.click(flex)
    expect(props.setFieldValue).toHaveBeenCalled()
    expect(flex).toHaveStyle(`background-color: ${COLORS.blue10}`)
    const ot2 = screen.getByLabelText('RobotTypeTile_OT-2 Standard')
    fireEvent.click(ot2)
    expect(props.setFieldValue).toHaveBeenCalled()
    expect(ot2).toHaveStyle(`background-color: ${COLORS.white}`)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(props.proceed).toHaveBeenCalled()
  })
})

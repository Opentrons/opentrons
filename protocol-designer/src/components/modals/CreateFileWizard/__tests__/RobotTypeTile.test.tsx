import * as React from 'react'
import i18n from 'i18next'
import { COLORS, renderWithProviders } from '@opentrons/components'
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
    const { getByLabelText, getByRole } = render(props)
    getByLabelText('OpentronsFlex.png')
    getByLabelText('OT2.png')
    const flex = getByLabelText('RobotTypeTile_OT-3 Standard')
    flex.click()
    expect(props.setFieldValue).toHaveBeenCalled()
    expect(flex).toHaveStyle(`background-color: ${COLORS.lightBlue}`)
    const ot2 = getByLabelText('RobotTypeTile_OT-2 Standard')
    ot2.click()
    expect(props.setFieldValue).toHaveBeenCalled()
    expect(ot2).toHaveStyle(`background-color: ${COLORS.white}`)
    getByRole('button', { name: 'Next' }).click()
    expect(props.proceed).toHaveBeenCalled()
  })
})

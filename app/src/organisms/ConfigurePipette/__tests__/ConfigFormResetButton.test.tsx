import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'

import { i18n } from '../../../i18n'
import { ConfigFormResetButton } from '../ConfigFormResetButton'

const render = (props: React.ComponentProps<typeof ConfigFormResetButton>) => {
  return renderWithProviders(<ConfigFormResetButton {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ConfigFormResetButton', () => {
  let props: React.ComponentProps<typeof ConfigFormResetButton>
  beforeEach(() => {
    props = {
      onClick: jest.fn(),
      disabled: false,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders text and not disabled', () => {
    const { getByRole, getByText } = render(props)
    const button = getByRole('button', { name: 'Reset all' })
    getByText(
      'These are advanced settings. Please do not attempt to adjust without assistance from Opentrons Support. Changing these settings may affect the lifespan of your pipette.'
    )
    getByText(
      'These settings do not override any pipette settings defined in protocols.'
    )
    fireEvent.click(button)
    expect(props.onClick).toHaveBeenCalled()
  })
  it('renders button text and is disabled', () => {
    props = {
      onClick: jest.fn(),
      disabled: true,
    }
    const { getByRole } = render(props)
    const button = getByRole('button', { name: 'Reset all' })
    expect(button).toBeDisabled()
  })
})

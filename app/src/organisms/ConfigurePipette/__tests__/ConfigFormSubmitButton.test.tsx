import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { ConfigFormSubmitButton } from '../ConfigFormSubmitButton'

const render = (props: React.ComponentProps<typeof ConfigFormSubmitButton>) => {
  return renderWithProviders(<ConfigFormSubmitButton {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ConfigFormSubmitButton', () => {
  let props: React.ComponentProps<typeof ConfigFormSubmitButton>
  beforeEach(() => {
    props = {
      disabled: false,
      formId: 'id',
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders bottom button text and is not disabled', () => {
    const { getByRole } = render(props)
    getByRole('button', { name: 'Confirm' })
  })
  it('renders bottom button text and disabled', () => {
    props = {
      disabled: true,
      formId: 'id',
    }
    const { getByRole } = render(props)
    const button = getByRole('button', { name: 'Confirm' })
    expect(button).toBeDisabled()
  })
})

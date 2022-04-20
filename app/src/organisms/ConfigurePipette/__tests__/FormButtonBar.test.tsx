import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { FormButtonBar } from '../FormButtonBar'
import { fireEvent } from '@testing-library/react'

const render = (props: React.ComponentProps<typeof FormButtonBar>) => {
  return renderWithProviders(<FormButtonBar {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('FormButtonBar', () => {
  let props: React.ComponentProps<typeof FormButtonBar>
  beforeEach(() => {
    props = {
      isTopButton: true,
      onClick: jest.fn(),
      disabled: false,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders top button text and not disabled', () => {
    const { getByRole } = render(props)
    const button = getByRole('button', { name: 'Reset all' })
    fireEvent.click(button)
    expect(props.onClick).toHaveBeenCalled()
  })
  it('renders top button text and is disabled', () => {
    props = {
      isTopButton: true,
      onClick: jest.fn(),
      disabled: true,
    }
    const { getByRole } = render(props)
    const button = getByRole('button', { name: 'Reset all' })
    expect(button).toBeDisabled()
  })
  it('renders bottom button text and is not disabled', () => {
    props = {
      isTopButton: false,
      onClick: jest.fn(),
      disabled: false,
    }
    const { getByRole } = render(props)
    getByRole('button', { name: 'Confirm' })
  })
  it('renders bottom button text and disabled', () => {
    props = {
      isTopButton: false,
      onClick: jest.fn(),
      disabled: true,
    }
    const { getByRole } = render(props)
    const button = getByRole('button', { name: 'Confirm' })
    expect(button).toBeDisabled()
  })
})

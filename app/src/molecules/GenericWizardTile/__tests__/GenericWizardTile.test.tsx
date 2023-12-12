import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { getIsOnDevice } from '../../../redux/config'
import { GenericWizardTile } from '..'

jest.mock('../../../redux/config')

const mockGetIsOnDevice = getIsOnDevice as jest.MockedFunction<
  typeof getIsOnDevice
>

const render = (props: React.ComponentProps<typeof GenericWizardTile>) => {
  return renderWithProviders(<GenericWizardTile {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('GenericWizardTile', () => {
  let props: React.ComponentProps<typeof GenericWizardTile>

  beforeEach(() => {
    props = {
      rightHandBody: <div>right hand body</div>,
      bodyText: 'body',
      proceed: jest.fn(),
      proceedButtonText: <div>Continue</div>,
      header: 'header',
      getHelp: 'getHelpUrl',
    }
    mockGetIsOnDevice.mockReturnValue(false)
  })
  it('renders correct generic tile information with a help link', () => {
    render(props)
    screen.getByText('body')
    const btn = screen.getByText('Continue')
    screen.getByText('header')
    fireEvent.click(btn)
    expect(props.proceed).toHaveBeenCalled()
    screen.getByText('Need help?')
    expect(screen.queryByText('Go back')).not.toBeInTheDocument()
  })
  it('renders correct generic tile information for on device display', () => {
    mockGetIsOnDevice.mockReturnValue(true)
    render(props)
    screen.getByText('body')
    screen.getByText('header')
    fireEvent.click(screen.getByRole('button'))
    expect(props.proceed).toHaveBeenCalled()
  })
  it('renders correct generic tile information with a back button', () => {
    props = {
      ...props,
      back: jest.fn(),
    }
    render(props)
    const btn = screen.getByText('Go back')
    fireEvent.click(btn)
    expect(props.back).toHaveBeenCalled()
  })
  it('renders correct generic tile information with back button disabled', () => {
    props = {
      ...props,
      back: jest.fn(),
      backIsDisabled: true,
    }
    render(props)
    const btn = screen.getByLabelText('back')
    fireEvent.click(btn)
    expect(btn).toBeDisabled()
  })
})

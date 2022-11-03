import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { GenericWizardTile } from '..'

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
      proceedButtonText: 'continue',
      header: 'header',
      getHelp: 'getHelpUrl',
    }
  })
  it('renders correct generic tile information with a help link', () => {
    const { getByText } = render(props)
    getByText('body')
    const btn = getByText('continue')
    getByText('header')
    fireEvent.click(btn)
    expect(props.proceed).toHaveBeenCalled()
    getByText('Need help?')
    expect(screen.queryByText('Go back')).not.toBeInTheDocument()
  })

  it('renders correct generic tile information with a back button', () => {
    props = {
      ...props,
      back: jest.fn(),
    }
    const { getByText } = render(props)
    const btn = getByText('Go back')
    fireEvent.click(btn)
    expect(props.back).toHaveBeenCalled()
  })
})

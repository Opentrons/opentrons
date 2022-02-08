import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { Slideout } from '..'
import { i18n } from '../../../i18n'
import { renderWithProviders } from '@opentrons/components'

const render = (props: React.ComponentProps<typeof Slideout>) => {
  return renderWithProviders(<Slideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('Slideout', () => {
  let props: React.ComponentProps<typeof Slideout>
  beforeEach(() => {
    props = {
      title: 'Set Engage Height for Magnetic Module GEN1',
      children: <div>Mock Children</div>,
      isExpanded: true,
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct title and body for a gen1 magnetic module', () => {
    const { getByText } = render(props)

    getByText('Set Engage Height for Magnetic Module GEN1')
    getByText('Mock Children')
  })

  it('renders the exit button and it is clickable', () => {
    const { getByRole } = render(props)
    const button = getByRole('button', { name: /exit/i })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(button).not.toBeInTheDocument()
  })
})

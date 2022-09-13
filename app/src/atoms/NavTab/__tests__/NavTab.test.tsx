import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { NavTab } from '../'

const render = (props: React.ComponentProps<typeof NavTab>) => {
  return renderWithProviders(
    <MemoryRouter>
      <NavTab {...props} />
    </MemoryRouter>
  )[0]
}

describe('NavTab', () => {
  let props: React.ComponentProps<typeof NavTab>

  beforeEach(() => {
    props = {
      to: '/protocols',
      tabName: 'protocols',
      disabled: false,
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders navtab with text and link', () => {
    const { getByText } = render(props)
    const tab = getByText('protocols')
    expect(tab).toHaveAttribute('href', '/protocols')
    expect(tab).toHaveStyle('pointer-Events: auto')
  })

  it('should navtab is disabled if disabled is true', () => {
    props.disabled = true
    const { getByText } = render(props)
    const tab = getByText('protocols')
    expect(tab).toHaveStyle('pointer-Events: none')
  })

  it('renders navtab when pass to / as to', () => {
    props.to = '/'
    props.tabName = 'root'
    const { getByText } = render(props)
    const tab = getByText('root')
    expect(tab).not.toBeDisabled()
  })
})

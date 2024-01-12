import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
  renderWithProviders,
  SPACING,
  LEGACY_COLORS,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'
import { NavTab } from '..'

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
    expect(tab).toHaveStyle(
      `padding: 0 ${SPACING.spacing4} ${SPACING.spacing8}`
    )
    expect(tab).toHaveStyle(`font-size: ${String(TYPOGRAPHY.fontSizeLabel)}`)
    expect(tab).toHaveStyle(
      `font-weight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(tab).toHaveStyle(`color: ${String(COLORS.grey50Enabled)}`)
    fireEvent.click(tab)
    expect(tab).toHaveStyle(`color: ${String(COLORS.black90)}`)
    expect(tab).toHaveStyle(
      `border-bottom-color: ${String(COLORS.blue50)}`
    )
    expect(tab).toHaveStyle(`border-bottom-width: 2px`)
    expect(tab).toHaveStyle(
      `border-bottom-style: ${String(BORDERS.styleSolid)}`
    )
  })

  it('should navtab is disabled if disabled is true', () => {
    props.disabled = true
    const { getByText } = render(props)
    const tab = getByText('protocols')
    expect(tab.tagName.toLowerCase()).toBe('span')
    expect(tab).toHaveStyle(
      `padding: 0 ${SPACING.spacing4} ${SPACING.spacing8}`
    )
    expect(tab).toHaveStyle(`font-size: ${String(TYPOGRAPHY.fontSizeLabel)}`)
    expect(tab).toHaveStyle(
      `font-weight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(tab).toHaveStyle(`color: ${String(COLORS.grey40)}`)
  })

  it('renders navtab when pass to / as to', () => {
    props.to = '/'
    props.tabName = 'root'
    const { getByText } = render(props)
    const tab = getByText('root')
    expect(tab).toHaveAttribute('href', '/')
  })
})

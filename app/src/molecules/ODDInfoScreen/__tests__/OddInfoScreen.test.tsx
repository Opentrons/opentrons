import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { COLORS } from '@opentrons/components'

import { OddInfoScreen } from '../OddInfoScreen'

import type { OddInfoScreenType } from '../OddInfoScreen'

describe('OddInfoScreen', () => {
  const renderComponent = (
    props: React.ComponentProps<typeof OddInfoScreen>
  ) => {
    return render(<OddInfoScreen {...props} />)
  }

  it('renders with default props', () => {
    renderComponent({ type: 'neutral', header: 'Test Header' })
    expect(screen.getByText('Test Header')).toBeInTheDocument()
    expect(screen.getByLabelText('icon-ot-alert')).toBeInTheDocument() // default icon is ot-alert
    expect(screen.getByLabelText('icon-ot-alert')).toHaveStyle('width: 2.5rem')
  })

  it('renders with all props', () => {
    renderComponent({
      type: 'success',
      header: 'Success Header',
      subText: 'This is a success message.',
      textSize: 'large',
    })
    expect(screen.getByText('Success Header')).toBeInTheDocument()
    expect(screen.getByText('This is a success message.')).toBeInTheDocument()
    expect(screen.getByLabelText('icon-ot-check')).toBeInTheDocument()
    expect(screen.getByLabelText('icon-ot-check')).toHaveStyle('width: 3.75rem')
  })

  const types: OddInfoScreenType[] = [
    'error',
    'alt',
    'neutral',
    'success',
    'warning',
  ]
  types.forEach(type => {
    it(`renders ${type} type correctly`, () => {
      renderComponent({ type, header: `${type} Header` })
      expect(screen.getByText(`${type} Header`)).toBeInTheDocument()
      const expectedIcon = type === 'success' ? 'ot-check' : 'ot-alert'
      const icon = screen.getByLabelText(`icon-${expectedIcon}`)
      expect(icon).toBeInTheDocument()
      const expectedRole =
        type === 'error' || type === 'warning' ? 'alert' : 'status'
      const infoScreen = screen.getByRole(expectedRole)
      let expectedBgColor = ''
      if (type === 'neutral') expectedBgColor = COLORS.grey35
      else if (type === 'error') expectedBgColor = COLORS.red35
      else if (type === 'success') expectedBgColor = COLORS.green35
      else if (type === 'warning') expectedBgColor = COLORS.yellow35
      else if (type === 'alt') expectedBgColor = COLORS.blue35
      expect(infoScreen).toHaveStyle(`background-color: ${expectedBgColor}`)
    })
  })

  it('renders without an icon when hasIcon is false', () => {
    renderComponent({ type: 'neutral', header: 'No Icon', hasIcon: false })
    expect(screen.getByText('No Icon')).toBeInTheDocument()
    expect(screen.queryByLabelText('icon')).not.toBeInTheDocument()
  })

  it('renders with a custom icon', () => {
    renderComponent({
      type: 'neutral',
      header: 'Test Custom Icon',
      hasIcon: true,
      iconName: 'ot-consolidate',
    })
    expect(screen.getByText('Test Custom Icon')).toBeInTheDocument()
    const icon = screen.getByLabelText('icon-ot-consolidate')
    expect(icon).toBeInTheDocument()
  })

  it('renders subtext correctly', () => {
    renderComponent({
      type: 'neutral',
      header: 'Header',
      subText: 'Subtext here',
    })
    expect(screen.getByText('Header')).toBeInTheDocument()
    const subTextElement = screen.getByText('Subtext here')
    expect(subTextElement).toBeInTheDocument()
  })
})

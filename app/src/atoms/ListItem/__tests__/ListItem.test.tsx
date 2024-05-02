import * as React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { BORDERS, COLORS, SPACING } from '@opentrons/components'
import { renderWithProviders } from '../../../__testing-utils__'

import { ListItem } from '..'

const render = (props: React.ComponentProps<typeof ListItem>) =>
  renderWithProviders(<ListItem {...props} />)

describe('ListItem', () => {
  let props: React.ComponentProps<typeof ListItem>

  beforeEach(() => {
    props = {
      type: 'error',
      children: <div>mock listitem content</div>,
    }
  })

  it('should render correct style - error', () => {
    render(props)
    screen.getByText('mock listitem content')
    const listItem = screen.getByTestId('ListItem_error')
    expect(listItem).toHaveStyle(`backgroundColor: ${COLORS.red35}`)
    expect(listItem).toHaveStyle(
      `padding: ${SPACING.spacing16} ${SPACING.spacing24}`
    )
    expect(listItem).toHaveStyle(`borderRadius: ${BORDERS.borderRadius12}`)
  })
  it('should render correct style - noActive', () => {
    props.type = 'noActive'
    render(props)
    screen.getByText('mock listitem content')
    const listItem = screen.getByTestId('ListItem_noActive')
    expect(listItem).toHaveStyle(`backgroundColor: ${COLORS.grey35}`)
    expect(listItem).toHaveStyle(
      `padding: ${SPACING.spacing16} ${SPACING.spacing24}`
    )
    expect(listItem).toHaveStyle(`borderRadius: ${BORDERS.borderRadius12}`)
  })
  it('should render correct style - success', () => {
    props.type = 'success'
    render(props)
    screen.getByText('mock listitem content')
    const listItem = screen.getByTestId('ListItem_success')
    expect(listItem).toHaveStyle(`backgroundColor: ${COLORS.green35}`)
    expect(listItem).toHaveStyle(
      `padding: ${SPACING.spacing16} ${SPACING.spacing24}`
    )
    expect(listItem).toHaveStyle(`borderRadius: ${BORDERS.borderRadius12}`)
  })
  it('should render correct style - warning', () => {
    props.type = 'warning'
    render(props)
    screen.getByText('mock listitem content')
    const listItem = screen.getByTestId('ListItem_warning')
    expect(listItem).toHaveStyle(`backgroundColor: ${COLORS.yellow35}`)
    expect(listItem).toHaveStyle(
      `padding: ${SPACING.spacing16} ${SPACING.spacing24}`
    )
    expect(listItem).toHaveStyle(`borderRadius: ${BORDERS.borderRadius12}`)
  })
})

import * as React from 'react'

import {
  BORDERS,
  COLORS,
  LEGACY_COLORS,
  renderWithProviders,
  SPACING,
} from '@opentrons/components'

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
    const [{ getByText, getByTestId }] = render(props)
    getByText('mock listitem content')
    const listItem = getByTestId('ListItem_error')
    expect(listItem).toHaveStyle(`backgroundColor: ${COLORS.red35}`)
    expect(listItem).toHaveStyle(
      `padding: ${SPACING.spacing16} ${SPACING.spacing24}`
    )
    expect(listItem).toHaveStyle(`borderRadius: ${BORDERS.borderRadiusSize3}`)
  })
  it('should render correct style - noActive', () => {
    props.type = 'noActive'
    const [{ getByText, getByTestId }] = render(props)
    getByText('mock listitem content')
    const listItem = getByTestId('ListItem_noActive')
    expect(listItem).toHaveStyle(`backgroundColor: ${COLORS.grey35}`)
    expect(listItem).toHaveStyle(
      `padding: ${SPACING.spacing16} ${SPACING.spacing24}`
    )
    expect(listItem).toHaveStyle(`borderRadius: ${BORDERS.borderRadiusSize3}`)
  })
  it('should render correct style - success', () => {
    props.type = 'success'
    const [{ getByText, getByTestId }] = render(props)
    getByText('mock listitem content')
    const listItem = getByTestId('ListItem_success')
    expect(listItem).toHaveStyle(`backgroundColor: ${COLORS.green35}`)
    expect(listItem).toHaveStyle(
      `padding: ${SPACING.spacing16} ${SPACING.spacing24}`
    )
    expect(listItem).toHaveStyle(`borderRadius: ${BORDERS.borderRadiusSize3}`)
  })
  it('should render correct style - warning', () => {
    props.type = 'warning'
    const [{ getByText, getByTestId }] = render(props)
    getByText('mock listitem content')
    const listItem = getByTestId('ListItem_warning')
    expect(listItem).toHaveStyle(`backgroundColor: ${COLORS.yellow35}`)
    expect(listItem).toHaveStyle(
      `padding: ${SPACING.spacing16} ${SPACING.spacing24}`
    )
    expect(listItem).toHaveStyle(`borderRadius: ${BORDERS.borderRadiusSize3}`)
  })
})

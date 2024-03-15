import * as React from 'react'
import { describe, it, beforeEach, expect } from 'vitest'
import { renderWithProviders } from '../../../testing/utils'
import { screen } from '@testing-library/react'
import { SPACING } from '../../../ui-style-constants'
import { BORDERS, COLORS } from '../../../helix-design-system'

import { LocationIcon } from '..'

const render = (props: React.ComponentProps<typeof LocationIcon>) => {
  return renderWithProviders(<LocationIcon {...props} />)
}

describe('LocationIcon', () => {
  let props: React.ComponentProps<typeof LocationIcon>

  beforeEach(() => {
    props = {
      slotName: 'A1',
    }
  })

  it('should render the proper styles', () => {
    render(props)
    const locationIcon = screen.getByTestId('LocationIcon_A1')
    expect(locationIcon).toHaveStyle(`padding: ${SPACING.spacing4} 0.375rem`)
    expect(locationIcon).toHaveStyle('height: 2rem')
    expect(locationIcon).toHaveStyle('width: max-content')
    expect(locationIcon).toHaveStyle(`border: 2px solid ${COLORS.black90}`)
    expect(locationIcon).toHaveStyle(`border-radius: ${BORDERS.borderRadius12}`)
  })

  it('should render slot name', () => {
    render(props)
    screen.getByText('A1')
  })

  it('should render an icon', () => {
    props = {
      iconName: 'ot-temperature-v2',
    }
    render(props)
    screen.getByLabelText(props.iconName as string)
  })
})

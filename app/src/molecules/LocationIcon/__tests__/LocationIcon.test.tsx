import * as React from 'react'

import {
  BORDERS,
  COLORS,
  renderWithProviders,
  SPACING,
} from '@opentrons/components'

import { LocationIcon } from '../'

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
    const [{ getByTestId }] = render(props)
    const locationIcon = getByTestId('LocationIcon_A1')
    expect(locationIcon).toHaveStyle(
      `padding: ${SPACING.spacing4} ${SPACING.spacing8}`
    )
    expect(locationIcon).toHaveStyle('height: 2rem')
    expect(locationIcon).toHaveStyle('width: max-content')
    expect(locationIcon).toHaveStyle(`border: 2px solid ${COLORS.darkBlack100}`)
    expect(locationIcon).toHaveStyle(
      `border-radius: ${BORDERS.borderRadiusSize3}`
    )
  })

  it('should render slot name', () => {
    const [{ getByText }] = render(props)
    getByText('A1')
  })

  it('should render an icon', () => {
    props = {
      iconName: 'ot-temperature-v2',
    }
    const [{ getByLabelText }] = render(props)
    getByLabelText(props.iconName as string)
  })
})

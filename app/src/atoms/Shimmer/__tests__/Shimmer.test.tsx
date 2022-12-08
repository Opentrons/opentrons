import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { Shimmer } from '..'

const render = (props: React.ComponentProps<typeof Shimmer>) => {
  return renderWithProviders(<Shimmer {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('Shimmer', () => {
  it('renders shimmer with correct dimensions/style', () => {
    const props = {
      width: 'mockWidth',
      height: 'mockHeight',
      backgroundSize: 'mockBackgroundSize',
    }
    const { getByTestId } = render(props)
    const shimmer = getByTestId('Shimmer')
    expect(shimmer).toHaveStyle(`width : ${props.width}`)
    expect(shimmer).toHaveStyle(`height: ${props.height}`)
    expect(shimmer).toHaveStyle(`background-size: ${props.backgroundSize}`)
  })
})

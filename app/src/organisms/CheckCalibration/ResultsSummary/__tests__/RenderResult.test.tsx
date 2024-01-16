import * as React from 'react'
import {
  renderWithProviders,
  COLORS,
  COLORS,
  SIZE_1,
} from '@opentrons/components'
import { i18n } from '../../../../i18n'

import { RenderResult } from '../RenderResult'

const render = (props: React.ComponentProps<typeof RenderResult>) => {
  return renderWithProviders(<RenderResult {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RenderResult', () => {
  let props: React.ComponentProps<typeof RenderResult>

  beforeEach(() => {
    props = {
      isBadCal: false,
    }
  })

  it('should render calibration result and icon - isBadCal: false', () => {
    const { getByText, getByTestId } = render(props)
    getByText('Good calibration')
    const icon = getByTestId('RenderResult_icon')
    expect(icon).toHaveStyle(`color: ${String(COLORS.green50)}`)
    expect(icon).toHaveStyle(`height: ${String(SIZE_1)}`)
    expect(icon).toHaveStyle(`width: ${String(SIZE_1)}`)
  })

  it('should render calibration result and icon - isBadCal: true', () => {
    props.isBadCal = true
    const { getByText, getByTestId } = render(props)
    getByText('Recalibration recommended')
    const icon = getByTestId('RenderResult_icon')
    expect(icon).toHaveStyle(`color: ${String(COLORS.yellow50)}`)
    expect(icon).toHaveStyle(`height: ${String(SIZE_1)}`)
    expect(icon).toHaveStyle(`width: ${String(SIZE_1)}`)
  })
})

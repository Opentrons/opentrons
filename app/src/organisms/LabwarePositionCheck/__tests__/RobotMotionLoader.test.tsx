import { i18n } from '../../../i18n'
import { RobotMotionLoader } from '../RobotMotionLoader'
import { renderWithProviders } from '@opentrons/components'
import * as React from 'react'

const mockHeader = 'Stand back, robot needs some space right now'

const render = () => {
  return renderWithProviders(<RobotMotionLoader header={mockHeader} />, {
    i18nInstance: i18n,
  })[0]
}

describe('Robot in Motion Modal', () => {
  it('should render robot in motion loader with header', () => {
    const { getByRole } = render()
    getByRole('heading', { name: mockHeader })
  })
})

import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { RobotMotionLoader } from '../RobotMotionLoader'
import { i18n } from '../../../i18n'

const mockHeader = 'Stand back, robot needs some space right now'

const render = () => {
  return renderWithProviders(<RobotMotionLoader header={mockHeader} />, {
    i18nInstance: i18n,
  })[0]
}

describe('Robot in Motion Modal', () => {
  it('should render robot in motion loader with header', () => {
    const { getByRole } = render()
    getByRole('heading', {name: mockHeader})
  })
})

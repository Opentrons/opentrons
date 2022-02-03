import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { useIsRobotViewable } from '../hooks'
import { PipettesAndModules } from '../PipettesAndModules'

jest.mock('../hooks')

const mockUseIsRobotViewable = useIsRobotViewable as jest.MockedFunction<
  typeof useIsRobotViewable
>

const render = () => {
  return renderWithProviders(<PipettesAndModules robotName="otie" />, {
    i18nInstance: i18n,
  })
}

describe('PipettesAndModules', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('renders an empty state message when robot is not on the network', () => {
    mockUseIsRobotViewable.mockReturnValue(false)
    const [{ getByText }] = render()

    getByText('Robot must be on the network to see pipettes and modules')
  })
})

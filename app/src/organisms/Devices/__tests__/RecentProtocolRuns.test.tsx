import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { useIsRobotViewable } from '../hooks'
import { RecentProtocolRuns } from '../RecentProtocolRuns'

jest.mock('../hooks')

const mockUseIsRobotViewable = useIsRobotViewable as jest.MockedFunction<
  typeof useIsRobotViewable
>

const render = () => {
  return renderWithProviders(<RecentProtocolRuns robotName="otie" />, {
    i18nInstance: i18n,
  })
}

describe('RecentProtocolRuns', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('renders an empty state message when robot is not on the network', () => {
    mockUseIsRobotViewable.mockReturnValue(false)
    const [{ getByText }] = render()

    getByText('Robot must be on the network to see protocol runs')
  })
})

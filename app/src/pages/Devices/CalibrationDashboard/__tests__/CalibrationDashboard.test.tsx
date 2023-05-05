import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { MemoryRouter, Route } from 'react-router-dom'

import { CalibrationDashboard } from '..'
import { i18n } from '../../../../i18n'
import {
  useCalibrationTaskList,
  useAttachedPipettes,
} from '../../../../organisms/Devices/hooks'
import { expectedTaskList } from '../../../../organisms/Devices/hooks/__fixtures__/taskListFixtures'
import { mockLeftProtoPipette } from '../../../../redux/pipettes/__fixtures__'
import { useDashboardCalibrateDeck } from '../hooks/useDashboardCalibrateDeck'
import { useDashboardCalibratePipOffset } from '../hooks/useDashboardCalibratePipOffset'
import { useDashboardCalibrateTipLength } from '../hooks/useDashboardCalibrateTipLength'

jest.mock('../../../../organisms/Devices/hooks')
jest.mock('../hooks/useDashboardCalibratePipOffset')
jest.mock('../hooks/useDashboardCalibrateTipLength')
jest.mock('../hooks/useDashboardCalibrateDeck')

const mockUseCalibrationTaskList = useCalibrationTaskList as jest.MockedFunction<
  typeof useCalibrationTaskList
>
const mockUseDashboardCalibratePipOffset = useDashboardCalibratePipOffset as jest.MockedFunction<
  typeof useDashboardCalibratePipOffset
>
const mockUseDashboardCalibrateTipLength = useDashboardCalibrateTipLength as jest.MockedFunction<
  typeof useDashboardCalibrateTipLength
>
const mockUseDashboardCalibrateDeck = useDashboardCalibrateDeck as jest.MockedFunction<
  typeof useDashboardCalibrateDeck
>
const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path="/devices/:robotName/robot-settings/calibration/dashboard">
        <CalibrationDashboard />
      </Route>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('CalibrationDashboard', () => {
  beforeEach(() => {
    mockUseCalibrationTaskList.mockReturnValue(expectedTaskList)
    mockUseDashboardCalibratePipOffset.mockReturnValue([() => {}, null])
    mockUseDashboardCalibrateTipLength.mockReturnValue([() => {}, null])
    mockUseDashboardCalibrateDeck.mockReturnValue([() => {}, null])
    mockUseAttachedPipettes.mockReturnValue({
      left: mockLeftProtoPipette,
      right: null,
    })
  })

  it('renders a robot calibration dashboard title', () => {
    const [{ getByText }] = render(
      '/devices/otie/robot-settings/calibration/dashboard'
    )

    getByText(`otie Calibration Dashboard`)
  })
})

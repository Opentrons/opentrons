import { vi, describe, it, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { CalibrationDashboard } from '..'

import { useCalibrationTaskList } from '/app/organisms/Desktop/Devices/hooks'
import { useDashboardCalibratePipOffset } from '../hooks/useDashboardCalibratePipOffset'
import { useDashboardCalibrateTipLength } from '../hooks/useDashboardCalibrateTipLength'
import { useDashboardCalibrateDeck } from '../hooks/useDashboardCalibrateDeck'
import { expectedTaskList } from '/app/organisms/Desktop/Devices/hooks/__fixtures__/taskListFixtures'
import { mockLeftProtoPipette } from '/app/redux/pipettes/__fixtures__'
import { useNotifyAllRunsQuery } from '/app/resources/runs'
import { useAttachedPipettes } from '/app/resources/instruments'

vi.mock('/app/redux-resources/robots')
vi.mock('/app/organisms/Desktop/Devices/hooks')
vi.mock('../hooks/useDashboardCalibratePipOffset')
vi.mock('../hooks/useDashboardCalibrateTipLength')
vi.mock('../hooks/useDashboardCalibrateDeck')
vi.mock('/app/resources/runs')
vi.mock('/app/resources/instruments')

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Routes>
        <Route
          path="/devices/:robotName/robot-settings/calibration/dashboard"
          element={<CalibrationDashboard />}
        />
      </Routes>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('CalibrationDashboard', () => {
  beforeEach(() => {
    vi.mocked(useCalibrationTaskList).mockReturnValue(expectedTaskList)
    vi.mocked(useDashboardCalibratePipOffset).mockReturnValue([() => {}, null])
    vi.mocked(useDashboardCalibrateTipLength).mockReturnValue([() => {}, null])
    vi.mocked(useDashboardCalibrateDeck).mockReturnValue([
      () => {},
      null,
      false,
    ])
    vi.mocked(useAttachedPipettes).mockReturnValue({
      left: mockLeftProtoPipette,
      right: null,
    })
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({} as any)
  })

  it('renders a robot calibration dashboard title', () => {
    render('/devices/otie/robot-settings/calibration/dashboard')

    screen.getByText(`otie Calibration Dashboard`)
  })
})

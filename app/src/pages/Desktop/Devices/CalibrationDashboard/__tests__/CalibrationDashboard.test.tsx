import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useCalibrationTaskList } from '/app/organisms/Desktop/Devices/hooks'
import { expectedTaskList } from '/app/organisms/Desktop/Devices/hooks/__fixtures__/taskListFixtures'
import { useAttachedPipettes } from '/app/resources/instruments'
import { mockLeftProtoPipette } from '/app/resources/instruments/__fixtures__'
import { useNotifyAllRunsQuery } from '/app/resources/runs'

import { CalibrationDashboard } from '..'
import { useDashboardCalibrateDeck } from '../hooks/useDashboardCalibrateDeck'
import { useDashboardCalibratePipOffset } from '../hooks/useDashboardCalibratePipOffset'
import { useDashboardCalibrateTipLength } from '../hooks/useDashboardCalibrateTipLength'

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

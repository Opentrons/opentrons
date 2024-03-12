import * as React from 'react'
import { vi, describe, it, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { CalibrationDashboard } from '..'

import {
  useCalibrationTaskList,
  useAttachedPipettes,
} from '../../../../organisms/Devices/hooks'
import { useDashboardCalibratePipOffset } from '../hooks/useDashboardCalibratePipOffset'
import { useDashboardCalibrateTipLength } from '../hooks/useDashboardCalibrateTipLength'
import { useDashboardCalibrateDeck } from '../hooks/useDashboardCalibrateDeck'
import { expectedTaskList } from '../../../../organisms/Devices/hooks/__fixtures__/taskListFixtures'
import { mockLeftProtoPipette } from '../../../../redux/pipettes/__fixtures__'
import { useNotifyAllRunsQuery } from '../../../../resources/runs'

vi.mock('../../../../organisms/Devices/hooks')
vi.mock('../hooks/useDashboardCalibratePipOffset')
vi.mock('../hooks/useDashboardCalibrateTipLength')
vi.mock('../hooks/useDashboardCalibrateDeck')
vi.mock('../../../../resources/runs')

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

import * as React from 'react'
import { vi, it, describe, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'

<<<<<<< HEAD
import { useRobotSettingsQuery } from '@opentrons/react-api-client'

=======
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
import { renderWithProviders } from '../../../__testing-utils__'

import { getIsShellReady } from '../../../redux/shell'

import { InitialLoadingScreen } from '..'

import type { UseQueryResult } from 'react-query'
import type { RobotSettingsResponse } from '@opentrons/api-client'

<<<<<<< HEAD
vi.mock('@opentrons/react-api-client')
vi.mock('../../../redux/config')
vi.mock('../../../redux/shell')
=======
vi.mock('../../../redux/config')
vi.mock('../../../redux/shell')

const mockSettings = {
  sleepMs: 60 * 1000 * 60 * 24 * 7,
  brightness: 4,
  textSize: 1,
  unfinishedUnboxingFlowRoute: null,
} as OnDeviceDisplaySettings
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))

const render = () => {
  return renderWithProviders(<InitialLoadingScreen />)
}

describe('InitialLoadingScreen', () => {
  beforeEach(() => {
<<<<<<< HEAD
    vi.mocked(getIsShellReady).mockReturnValue(false)
    vi.mocked(useRobotSettingsQuery).mockReturnValue(({
      data: { settings: [] },
    } as unknown) as UseQueryResult<RobotSettingsResponse>)
=======
    vi.mocked(getOnDeviceDisplaySettings).mockReturnValue(mockSettings)
    vi.mocked(getIsShellReady).mockReturnValue(false)
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
  })

  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should display spinner', () => {
    render()
    screen.getByLabelText('loading indicator')
  })
})

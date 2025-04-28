import type { RobotSettingsResponse } from '@opentrons/api-client'
import { useRobotSettingsQuery } from '@opentrons/react-api-client'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '/app/__testing-utils__'
import { getIsShellReady } from '/app/redux/shell'
import type { UseQueryResult } from 'react-query'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import { InitialLoadingScreen } from '..'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/config')
vi.mock('/app/redux/shell')

const render = () => {
  return renderWithProviders(<InitialLoadingScreen />)
}

describe('InitialLoadingScreen', () => {
  beforeEach(() => {
    vi.mocked(getIsShellReady).mockReturnValue(false)
    vi.mocked(useRobotSettingsQuery).mockReturnValue(({
      data: { settings: [] },
    } as unknown) as UseQueryResult<RobotSettingsResponse>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should display spinner', () => {
    render()
    screen.getByLabelText('loading indicator')
  })
})

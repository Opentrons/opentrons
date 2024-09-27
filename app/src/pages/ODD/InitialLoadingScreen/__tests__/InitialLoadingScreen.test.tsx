import { vi, it, describe, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'

import { useRobotSettingsQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'

import { getIsShellReady } from '/app/redux/shell'

import { InitialLoadingScreen } from '..'

import type { UseQueryResult } from 'react-query'
import type { RobotSettingsResponse } from '@opentrons/api-client'

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

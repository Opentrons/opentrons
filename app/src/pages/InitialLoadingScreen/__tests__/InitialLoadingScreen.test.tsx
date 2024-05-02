import * as React from 'react'
import { vi, it, describe, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'

import { useRobotSettingsQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '../../../__testing-utils__'

import { getIsShellReady } from '../../../redux/shell'

import { InitialLoadingScreen } from '..'

import type { UseQueryResult } from 'react-query'
import type { RobotSettingsResponse } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client')
vi.mock('../../../redux/config')
vi.mock('../../../redux/shell')

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

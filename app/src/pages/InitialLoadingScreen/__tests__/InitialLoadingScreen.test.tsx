import * as React from 'react'
import { vi, it, describe, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'

import { getOnDeviceDisplaySettings } from '../../../redux/config'
import { getIsShellReady } from '../../../redux/shell'

import { InitialLoadingScreen } from '..'

import type { OnDeviceDisplaySettings } from '../../../redux/config/schema-types'

vi.mock('../../../redux/config')
vi.mock('../../../redux/shell')

const mockSettings = {
  sleepMs: 60 * 1000 * 60 * 24 * 7,
  brightness: 4,
  textSize: 1,
  unfinishedUnboxingFlowRoute: null,
} as OnDeviceDisplaySettings

const render = () => {
  return renderWithProviders(<InitialLoadingScreen />)
}

describe('InitialLoadingScreen', () => {
  beforeEach(() => {
    vi.mocked(getOnDeviceDisplaySettings).mockReturnValue(mockSettings)
    vi.mocked(getIsShellReady).mockReturnValue(false)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should display spinner', () => {
    render()
    screen.getByLabelText('loading indicator')
  })
})

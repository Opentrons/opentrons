import * as React from 'react'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { getOnDeviceDisplaySettings } from '../../../redux/config'
import { getIsShellReady } from '../../../redux/shell'

import { InitialLoadingScreen } from '..'

import type { OnDeviceDisplaySettings } from '../../../redux/config/schema-types'

jest.mock('../../../redux/config')
jest.mock('../../../redux/shell')

const mockGetOnDeviceDisplaySettings = getOnDeviceDisplaySettings as jest.MockedFunction<
  typeof getOnDeviceDisplaySettings
>
const mockGetIsShellReady = getIsShellReady as jest.MockedFunction<
  typeof getIsShellReady
>

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
    mockGetOnDeviceDisplaySettings.mockReturnValue(mockSettings)
    mockGetIsShellReady.mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should display spinner', () => {
    render()
    screen.getByLabelText('loading')
  })
})

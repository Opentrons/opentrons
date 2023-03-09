import * as React from 'react'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import {
  getOnDeviceDisplaySettings,
  updateConfigValue,
} from '../../../../redux/config'
import { DisplayBrightness } from '../DisplayBrightness'

jest.mock('../../../../redux/config')

const mockFunc = jest.fn()

const mockGetOnDeviceDisplaySettings = getOnDeviceDisplaySettings as jest.MockedFunction<
  typeof getOnDeviceDisplaySettings
>
const mockUpdateConfigValue = updateConfigValue as jest.MockedFunction<
  typeof updateConfigValue
>

const render = (props: React.ComponentProps<typeof DisplayBrightness>) => {
  return renderWithProviders(<DisplayBrightness {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DisplayBrightness', () => {
  let props: React.ComponentProps<typeof DisplayBrightness>

  beforeEach(() => {
    props = {
      setCurrentOption: mockFunc,
    }
    mockGetOnDeviceDisplaySettings.mockReturnValue({
      sleepMS: 1,
      brightness: 4,
      textSize: 1,
    } as any)
  })

  afterEach(() => {})

  it('should render text and buttons', () => {
    const [{ getByText, getByTestId }] = render(props)
    getByText('Display Brightness')
    getByTestId('DisplayBrightness_back_button')
    getByTestId('DisplayBrightness_decrease')
    getByTestId('DisplayBrightness_increase')
  })

  it('plus button should be disabled when brightness max(1)', () => {
    mockGetOnDeviceDisplaySettings.mockReturnValue({
      sleepMS: 1,
      brightness: 1,
      textSize: 1,
    } as any)
    const [{ getByTestId }] = render(props)
    const button = getByTestId('DisplayBrightness_increase')
    expect(button).toBeDisabled()
  })

  it('plus button should be disabled when brightness min(6)', () => {
    mockGetOnDeviceDisplaySettings.mockReturnValue({
      sleepMS: 1,
      brightness: 6,
      textSize: 1,
    } as any)
    const [{ getByTestId }] = render(props)
    const button = getByTestId('DisplayBrightness_decrease')
    expect(button).toBeDisabled()
  })

  it('should call mock function when tapping plus button', () => {
    const [{ getByTestId }] = render(props)
    const button = getByTestId('DisplayBrightness_increase')
    fireEvent.click(button)
    expect(mockUpdateConfigValue).toHaveBeenCalled()
  })

  it('should call mock function when tapping minus button', () => {
    const [{ getByTestId }] = render(props)
    const button = getByTestId('DisplayBrightness_decrease')
    fireEvent.click(button)
    expect(mockUpdateConfigValue).toHaveBeenCalled()
  })

  it('should call mock function when tapping back button', () => {
    const [{ getByTestId }] = render(props)
    const button = getByTestId('DisplayBrightness_back_button')
    fireEvent.click(button)
    expect(props.setCurrentOption).toHaveBeenCalled()
  })
})

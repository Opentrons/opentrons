import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import { CameraTileSetting } from '../CameraTileSetting'

import type { CameraTileSettingProps } from '../CameraTileSetting'

vi.mock('/app/organisms/ODD/ChildNavigation')

const render = (props: CameraTileSettingProps) => {
  return renderWithProviders(<CameraTileSetting {...props} />, {
    i18nInstance: i18n,
  })
}

describe('CameraTileSetting', () => {
  let mockProps: CameraTileSettingProps

  beforeEach(() => {
    mockProps = {
      value: 50,
      adjustValue: vi.fn(),
      title: 'Test Setting',
      subtext: 'Test subtext description',
      returnToHomeView: vi.fn(),
    }
    vi.mocked(ChildNavigation).mockReturnValue(<div>MOCK_CHILD_NAVIGATION</div>)
  })

  it('renders ChildNavigation with correct header', () => {
    render(mockProps)

    expect(vi.mocked(ChildNavigation)).toHaveBeenCalledWith(
      expect.objectContaining({
        header: 'Test Setting',
      }),
      {}
    )
  })

  it('calls returnToHomeView when back button is clicked', () => {
    vi.mocked(ChildNavigation).mockImplementation(({ onClickBack }) => (
      <button onClick={onClickBack} data-testid="back-button">
        Back
      </button>
    ))

    render(mockProps)

    const backButton = screen.getByTestId('back-button')
    fireEvent.click(backButton)

    expect(mockProps.returnToHomeView).toHaveBeenCalledTimes(1)
  })

  it('renders subtext description', () => {
    render(mockProps)

    screen.getByText('Test subtext description')
  })

  it('renders decrease button', () => {
    render(mockProps)

    screen.getByTestId('TouchscreenSetting_decrease')
  })

  it('renders increase button', () => {
    render(mockProps)

    screen.getByTestId('TouchscreenSetting_increase')
  })

  it('decrease button is disabled when value is <=0', () => {
    const propsWithZeroValue = {
      ...mockProps,
      value: 0,
    }
    render(propsWithZeroValue)

    const decreaseButton = screen.getByTestId('TouchscreenSetting_decrease')
    expect(decreaseButton).toBeDisabled()
  })

  it('increase button is disabled when value is >=100', () => {
    const propsWithMaxValue = {
      ...mockProps,
      value: 100,
    }
    render(propsWithMaxValue)

    const increaseButton = screen.getByTestId('TouchscreenSetting_increase')
    expect(increaseButton).toBeDisabled()
  })

  it('calls adjustValue with increased value when increase button is clicked', () => {
    render(mockProps)

    const increaseButton = screen.getByTestId('TouchscreenSetting_increase')
    fireEvent.click(increaseButton)

    expect(mockProps.adjustValue).toHaveBeenCalledWith(75)
  })

  it('calls adjustValue with decreased value when decrease button is clicked', () => {
    render(mockProps)

    const decreaseButton = screen.getByTestId('TouchscreenSetting_decrease')
    fireEvent.click(decreaseButton)

    expect(mockProps.adjustValue).toHaveBeenCalledWith(25)
  })

  it('clamps value at 100 when increasing from 75', () => {
    const propsWithHighValue = {
      ...mockProps,
      value: 75,
    }
    render(propsWithHighValue)

    const increaseButton = screen.getByTestId('TouchscreenSetting_increase')
    fireEvent.click(increaseButton)

    expect(mockProps.adjustValue).toHaveBeenCalledWith(100)
  })

  it('clamps value at 0 when decreasing from 25', () => {
    const propsWithLowValue = {
      ...mockProps,
      value: 25,
    }
    render(propsWithLowValue)

    const decreaseButton = screen.getByTestId('TouchscreenSetting_decrease')
    fireEvent.click(decreaseButton)

    expect(mockProps.adjustValue).toHaveBeenCalledWith(0)
  })

  it('rounds non-standard value to nearest valid percentage', () => {
    const propsWithNonStandardValue = {
      ...mockProps,
      value: 37,
    }
    render(propsWithNonStandardValue)

    const increaseButton = screen.getByTestId('TouchscreenSetting_increase')
    fireEvent.click(increaseButton)

    expect(mockProps.adjustValue).toHaveBeenCalledWith(50)
  })
})

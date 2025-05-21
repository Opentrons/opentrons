import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import { Retract } from '../Retract'

import type { ComponentProps } from 'react'

vi.mock('/app/redux-resources/analytics')

const render = (props: ComponentProps<typeof Retract>) => {
  return renderWithProviders(<Retract {...props} />, {
    i18nInstance: i18n,
  })
}

let mockTrackEventWithRobotSerial: any

describe('Retract', () => {
  let props: ComponentProps<typeof Retract>

  beforeEach(() => {
    props = {
      onBack: vi.fn(),
      state: {} as any,
      dispatch: vi.fn(),
      kind: 'aspirate',
    }
    mockTrackEventWithRobotSerial = vi.fn(
      () => new Promise(resolve => resolve({}))
    )
    vi.mocked(useTrackEventWithRobotSerial).mockReturnValue({
      trackEventWithRobotSerial: mockTrackEventWithRobotSerial,
    })
  })

  it('renders test, buttons, input field, and keyboard for retract after aspirating - speed', () => {
    render(props)
    screen.getByText('Retract after aspirating')
    screen.getByText('Continue')
    screen.getByText('Withdraw the tip from the liquid after aspirating')
    screen.getByText('Speed (mm/second)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
  })

  it('renders test, buttons, input field, and keyboard for retract after dispense - speed', () => {
    props.kind = 'dispense'
    render(props)
    screen.getByText('Retract after dispensing')
    screen.getByText('Continue')
    screen.getByText('Withdraw the tip from the liquid after dispensing')
    screen.getByText('Speed (mm/second)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
  })

  it('renders test, buttons, input field, and keyboard for retract after aspirating - position', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: '1' }))
    fireEvent.click(screen.getByRole('button', { name: '1' }))
    fireEvent.click(screen.getByText('Continue'))
    screen.getByText('Save')
    screen.getByText('Distance from bottom of well (mm)')
    screen.getByText('Between 0 and 2 mm')
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    screen.getByText('Value must be between 1 to 2')
  })
  it('calls dispatch with correct action and settings when save is clicked', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: '1' }))
    fireEvent.click(screen.getByRole('button', { name: '1' }))
    fireEvent.click(screen.getByText('Continue'))
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByText('Save'))
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_RETRACT_ASPIRATE',
      retractSettings: {
        speed: 11,
        positionFromBottom: 22,
      },
    })
  })

  it('should call mock function when clicking back button', () => {
    render(props)
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(props.onBack).toHaveBeenCalled()
  })
})

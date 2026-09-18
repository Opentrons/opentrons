import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('renders test, buttons, input field, and keyboard for retract after dispense - delay duration', async () => {
    const user = userEvent.setup()
    props.kind = 'dispense'
    render(props)
    screen.getByText('Retract after dispensing')
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Continue')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    screen.getByRole('button', { name: '.' })
    screen.getByText('Continue')
    screen.getByText('Delay duration (seconds)')
  })

  it('renders test, buttons, input field, and keyboard for retract after aspirating - position', async () => {
    render({
      ...props,
      state: {
        retractAspirate: { positionReference: 'well-bottom', position: 0 },
      } as any,
    })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Continue')
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: '.' }))
    await user.click(screen.getByRole('button', { name: '6' }))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Distance from bottom of well (mm)')
    screen.getByText('Between 0 and 3 mm')
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    screen.getByText('Value must be between 0 to 3')
    screen.getByText('Save')
  })
  it('calls dispatch with correct action and settings when save is clicked', async () => {
    const user = userEvent.setup()
    props.state.retractAspirate = {
      speed: 0,
      delayDuration: 0,
      position: 0,
      positionReference: 'well-bottom',
    }
    render(props)
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByText('Continue'))
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: '.' }))
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByText('Continue'))
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByText('Save'))
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_RETRACT_ASPIRATE',
      retractSettings: {
        speed: 11,
        delayDuration: 0.5,
        position: 2,
        positionReference: 'well-bottom',
      },
    })
  })

  it('should call mock function when clicking back button', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(props.onBack).toHaveBeenCalled()
  })
})

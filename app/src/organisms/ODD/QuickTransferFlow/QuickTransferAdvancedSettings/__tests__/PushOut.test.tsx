import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import QuickTransferState from '../__fixtures__/QuickTransferState.json'
import { PushOut } from '../PushOut'

import type { ComponentProps } from 'react'

vi.mock('/app/redux-resources/analytics')

const render = (props: ComponentProps<typeof PushOut>) => {
  return renderWithProviders(<PushOut {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEventWithRobotSerial: any

describe('PushOut', () => {
  let props: ComponentProps<typeof PushOut>

  beforeEach(() => {
    props = {
      onBack: vi.fn(),
      state: QuickTransferState as any,
      dispatch: vi.fn(),
      kind: 'dispense',
    }
    mockTrackEventWithRobotSerial = vi.fn(
      () => new Promise(resolve => resolve({}))
    )
    vi.mocked(useTrackEventWithRobotSerial).mockReturnValue({
      trackEventWithRobotSerial: mockTrackEventWithRobotSerial,
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders text, buttons for push out', async () => {
    render(props)
    const user = userEvent.setup()
    screen.getByText('Push out after dispensing')
    screen.getByText('Save')
    screen.getByText('Helps ensure all liquid leaves the tip')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
    await user.click(screen.getByText('Disabled'))
    screen.getByText('Save')
  })

  it('renders text, button, and keyboard for push out volume', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Push out volume (µL)')
    screen.getByText('Save')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    screen.getByRole('button', { name: '.' })
  })

  it('should call dispatch when clicking save button', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByText('Save'))
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_PUSH_OUT',
      pushOutSettings: {
        volume: 10,
      },
    })
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalledWith({
      name: 'quickTransferSettingSaved',
      properties: {
        setting: 'Push-out_dispense',
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

import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import QuickTransferState from '../__fixtures__/QuickTransferState.json'
import { TouchTip } from '../TouchTip'

import type { ComponentProps } from 'react'

vi.mock('/app/redux-resources/analytics')

const render = (props: ComponentProps<typeof TouchTip>) => {
  return renderWithProviders(<TouchTip {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEventWithRobotSerial: any

describe('TouchTip', () => {
  let props: ComponentProps<typeof TouchTip>

  beforeEach(() => {
    props = {
      onBack: vi.fn(),
      state: QuickTransferState as any,
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

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders text, buttons for touch tip aspirate', async () => {
    render(props)
    const user = userEvent.setup()
    screen.getByText('Touch tip after aspirating')
    screen.getByText('Save')
    screen.getByText('Touch tip to each side of the well after aspirating')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
    await user.click(screen.getByText('Enabled'))
    screen.getByText('Continue')
  })

  it('renders text, buttons for touch tip dispense', async () => {
    const user = userEvent.setup()
    props.kind = 'dispense'
    render(props)
    screen.getByText('Touch tip after dispensing')
    screen.getByText('Save')
    screen.getByText('Touch tip to each side of the well after dispensing')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
    await user.click(screen.getByText('Enabled'))
    screen.getByText('Continue')
  })

  it('renders text, buttons for touch tip speed - aspirate', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Speed (mm/second)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    screen.getByText('Continue')
  })

  it('renders text, buttons, input field, and keyboard for touch tip - aspirate', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Speed (mm/second)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
  })

  it('renders text, buttons, input field, and keyboard for touch tip position- aspirate', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Speed (mm/second)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Touch tip position from top of well (mm)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    await user.click(screen.getByRole('button', { name: '0' }))
  })

  it('should call dispatch when clicking save button - aspirate', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Speed (mm/second)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Touch tip position from top of well (mm)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByText('Save'))
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_TOUCH_TIP_ASPIRATE',
      position: 0,
      touchTipAspirateSpeed: 1,
    })
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalledWith({
      name: 'quickTransferSettingSaved',
      properties: {
        setting: 'TouchTip_aspirate',
      },
    })
  })

  it('should call dispatch when clicking save button - dispense', async () => {
    const user = userEvent.setup()
    props.kind = 'dispense'
    render(props)
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Speed (mm/second)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Touch tip position from top of well (mm)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByText('Save'))
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_TOUCH_TIP_DISPENSE',
      position: 0,
      touchTipDispenseSpeed: 1,
    })
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalledWith({
      name: 'quickTransferSettingSaved',
      properties: {
        setting: 'TouchTip_dispense',
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

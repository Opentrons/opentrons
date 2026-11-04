import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import QuickTransferState from '../__fixtures__/QuickTransferState.json'
import { AirGap } from '../AirGap'

import type { ComponentProps } from 'react'

vi.mock('/app/redux-resources/analytics')

const render = (props: ComponentProps<typeof AirGap>) => {
  return renderWithProviders(<AirGap {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEventWithRobotSerial: any

describe('AirGap', () => {
  let props: ComponentProps<typeof AirGap>

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

  it('renders text, buttons for air gap aspirate', async () => {
    render(props)
    const user = userEvent.setup()
    screen.getByText('Air gap after aspirating')
    screen.getByText('Save')
    screen.getByText('Draw air into the tip after aspirating')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
    await user.click(screen.getByText('Enabled'))
    screen.getByText('Continue')
  })

  it('renders text, buttons for air gap dispense', async () => {
    const user = userEvent.setup()
    props.kind = 'dispense'
    render(props)
    screen.getByText('Air gap after dispensing')
    screen.getByText('Save')
    screen.getByText('Draw in air before moving to trash to dispose of tip')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
    await user.click(screen.getByText('Enabled'))
    screen.getByText('Continue')
  })

  it('renders text, buttons, input field, and keyboard for air gap aspirating', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Air gap volume (µL)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByText('Save'))
    screen.getByText('Value must be between 0 to 9')
  })

  it('should call dispatch when clicking save button aspirate', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Air gap volume (µL)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByText('Save'))
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_AIR_GAP_ASPIRATE',
      volume: 1,
    })
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalledWith({
      name: 'quickTransferSettingSaved',
      properties: {
        setting: 'AirGap_aspirate',
      },
    })
  })

  it('should call dispatch when clicking save button dispense', async () => {
    const user = userEvent.setup()
    props.kind = 'dispense'
    render(props)
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Air gap volume (µL)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByText('Save'))
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_AIR_GAP_DISPENSE',
      volume: 5,
    })
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalledWith({
      name: 'quickTransferSettingSaved',
      properties: {
        setting: 'AirGap_dispense',
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

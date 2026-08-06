import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import QuickTransferState from '../__fixtures__/QuickTransferState.json'
import { Delay } from '../Delay'

import type { ComponentProps } from 'react'

vi.mock('/app/redux-resources/analytics')

const render = (props: ComponentProps<typeof Delay>) => {
  return renderWithProviders(<Delay {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEventWithRobotSerial: any

describe('Delay', () => {
  let props: ComponentProps<typeof Delay>

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

  it('renders text, buttons for delay aspirate', async () => {
    render(props)
    const user = userEvent.setup()
    screen.getByText('Delay after aspirating')
    screen.getByText('Save')
    screen.getByText('Delay after each aspiration and air gap')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
    await user.click(screen.getByText('Enabled'))
    screen.getByText('Continue')
  })

  it('renders text, buttons for delay dispense', async () => {
    const user = userEvent.setup()
    props.kind = 'dispense'
    render(props)
    screen.getByText('Delay before dispensing')
    screen.getByText('Save')
    screen.getByText('Delay after each dispense')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
    await user.click(screen.getByText('Enabled'))
    screen.getByText('Continue')
  })

  it('renders text, buttons, input field, and keyboard for delay before aspirating - volume', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Delay duration (seconds)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: '.' })
    screen.getByRole('button', { name: 'del' })
    await user.click(screen.getByRole('button', { name: '0' }))
    screen.getByText('Value must be between 0.1 to 9999999999')
    screen.getByText('Save')
  })

  it('should call dispatch when clicking save button', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Delay duration (seconds)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: '.' })
    screen.getByRole('button', { name: 'del' })
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: '.' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByText('Save'))
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_DELAY_ASPIRATE',
      delaySettings: {
        delayDuration: 0.2,
      },
    })
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalledWith({
      name: 'quickTransferSettingSaved',
      properties: {
        setting: 'Delay_aspirate',
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

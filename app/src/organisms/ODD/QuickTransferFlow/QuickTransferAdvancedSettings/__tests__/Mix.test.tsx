import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import QuickTransferState from '../__fixtures__/QuickTransferState.json'
import { Mix } from '../Mix'

import type { ComponentProps } from 'react'

vi.mock('/app/redux-resources/analytics')

const render = (props: ComponentProps<typeof Mix>) => {
  return renderWithProviders(<Mix {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEventWithRobotSerial: any

describe('Mix', () => {
  let props: ComponentProps<typeof Mix>

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

  it('renders text, buttons for mix aspirate', async () => {
    render(props)
    const user = userEvent.setup()
    screen.getByText('Mix before aspirating')
    screen.getByText('Continue')
    screen.getByText('Aspirate and dispense repeatedly before main aspiration')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
    await user.click(screen.getByText('Disabled'))
    screen.getByText('Save')
  })

  it('renders text, buttons for mix dispense', async () => {
    const user = userEvent.setup()
    props.kind = 'dispense'
    render(props)
    screen.getByText('Mix after dispensing')
    screen.getByText('Save')
    screen.getByText('Aspirate and dispense repeatedly before main aspiration')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
    await user.click(screen.getByText('Enabled'))
    screen.getByText('Continue')
  })

  it('renders text, buttons, input field, and keyboard for mix before aspirating - volume', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Mix volume (µL)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Value must be between 1 to 10')
  })

  it('renders text, buttons, input field, and keyboard for mix before aspirating - repetitions', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Mix repetitions')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    screen.getByText('Save')
  })

  it('should call dispatch when clicking save button', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Mix repetitions')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    await user.click(screen.getByText('Save'))
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_MIX_ON_ASPIRATE',
      mixSettings: {
        mixVolume: 10,
        repetitions: 12,
      },
    })
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalledWith({
      name: 'quickTransferSettingSaved',
      properties: {
        setting: 'Mix_aspirate',
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

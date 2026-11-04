import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import QuickTransferState from '../__fixtures__/QuickTransferState.json'
import { Condition } from '../Condition'

import type { ComponentProps } from 'react'

vi.mock('/app/redux-resources/analytics')

let mockTrackEventWithRobotSerial: any

const modifiedQuickTransferState = {
  ...QuickTransferState,
  path: 'multiAspirate',
  // leaves 8 µL of the 10 µL tip free for conditioning
  volume: 1,
}

const render = (props: ComponentProps<typeof Condition>) => {
  return renderWithProviders(<Condition {...props} />, {
    i18nInstance: i18n,
  })
}

describe('Condition', () => {
  let props: ComponentProps<typeof Condition>

  beforeEach(() => {
    props = {
      kind: 'aspirate',
      state: modifiedQuickTransferState as any,
      dispatch: vi.fn(),
      onBack: vi.fn(),
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

  it('should render text and buttons', () => {
    render(props)
    screen.getByText('Condition before aspirating')
    screen.getByText('Continue')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
  })

  it('should render text and numeric keyboard', async () => {
    const user = userEvent.setup()
    render(props)
    screen.getByText('Condition before aspirating')
    screen.getByText('Continue')
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Conditioning volume (µL)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
  })

  it('should disable the save button until a valid volume is entered', async () => {
    const user = userEvent.setup()
    render(props)
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    expect(screen.getByTestId('ChildNavigation_Primary_Button')).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '9' }))
    screen.getByText('Value must be between 0 to 8')
    expect(screen.getByTestId('ChildNavigation_Primary_Button')).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'del' }))
    await user.click(screen.getByRole('button', { name: '8' }))
    expect(screen.getByTestId('ChildNavigation_Primary_Button')).toBeEnabled()
  })

  it('should call dispatch when clicking save button', async () => {
    const user = userEvent.setup()
    render(props)
    screen.getByText('Condition before aspirating')
    screen.getByText('Continue')
    await user.click(screen.getByText('Enabled'))
    await user.click(screen.getByText('Continue'))
    await user.click(screen.getByRole('button', { name: '8' }))
    await user.click(screen.getByText('Save'))
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_CONDITION_ASPIRATE',
      conditionAspirate: 8,
    })
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalledWith({
      name: 'quickTransferSettingSaved',
      properties: {
        setting: 'Condition_aspirate',
      },
    })
  })
  it('should call mock function when clicking back button', async () => {
    const user = userEvent.setup()
    render(props)
    await user.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(props.onBack).toHaveBeenCalled()
  })
})

import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import QuickTransferState from '../__fixtures__/QuickTransferState.json'
import { PreWetTip } from '../PreWetTip'

import type { ComponentProps } from 'react'

vi.mock('/app/redux-resources/analytics')

const render = (props: ComponentProps<typeof PreWetTip>) => {
  return renderWithProviders(<PreWetTip {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEventWithRobotSerial: any

describe('PreWetTip', () => {
  let props: ComponentProps<typeof PreWetTip>

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

  it('renders text, buttons for pre-wet tip aspirate', () => {
    render(props)
    screen.getByText('Pre-wet tip before aspirating')
    screen.getByText('Save')
    screen.getByText(
      'Pre-wet by aspirating and dispensing the total aspiration volume'
    )
    screen.getByText('Enabled')
    screen.getByText('Disabled')
  })

  it('should call dispatch when clicking save button', () => {
    render(props)
    fireEvent.click(screen.getByText('Enabled'))
    fireEvent.click(screen.getByText('Save'))
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_PRE_WET_TIP',
      preWetTip: !props.state.preWetTip,
    })
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalledWith({
      name: 'quickTransferSettingSaved',
      properties: {
        setting: 'Pre-wet-tip_aspirate',
      },
    })
  })
  it('should call mock function when clicking back button', () => {
    render(props)
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(props.onBack).toHaveBeenCalled()
  })
})

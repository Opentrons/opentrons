import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import QuickTransferState from '../__fixtures__/QuickTransferState.json'
import { BlowOut } from '../BlowOut'

import type { ComponentProps } from 'react'

vi.mock('/app/redux-resources/analytics')

const render = (props: ComponentProps<typeof BlowOut>) => {
  return renderWithProviders(<BlowOut {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEventWithRobotSerial: any

describe('BlowOut', () => {
  let props: ComponentProps<typeof BlowOut>

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

  it('renders text, buttons for blowout fist screen', () => {
    render(props)
    screen.getByText('Blowout after dispensing')
    screen.getByText('Save')
    screen.getByText('Blow extra air through the tip')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
    fireEvent.click(screen.getByText('Enabled'))
    screen.getByText('Continue')
  })

  it('renders text, buttons for blowout second screen', () => {
    render(props)
    fireEvent.click(screen.getByText('Enabled'))
    fireEvent.click(screen.getByText('Continue'))
    screen.getByText('Select blowout location')
    screen.getByText('Destination well')
    screen.getByText('Source well')
    screen.getByText('Trash bin in A3')
    fireEvent.click(screen.getByText('Save'))
  })

  it('should call dispatch when clicking save button', () => {
    render(props)
    fireEvent.click(screen.getByText('Enabled'))
    fireEvent.click(screen.getByText('Continue'))
    screen.getByText('Select blowout location')
    screen.getByText('Destination well')
    screen.getByText('Source well')
    screen.getByText('Trash bin in A3')
    fireEvent.click(screen.getByText('Source well'))
    fireEvent.click(screen.getByText('Save'))
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_BLOW_OUT',
      location: 'source_well',
    })
    expect(mockTrackEventWithRobotSerial).toHaveBeenCalledWith({
      name: 'quickTransferSettingSaved',
      properties: {
        setting: 'BlowOut',
      },
    })
  })

  it('should call mock function when clicking back button', () => {
    render(props)
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(props.onBack).toHaveBeenCalled()
  })
})

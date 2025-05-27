import { fireEvent, screen } from '@testing-library/react'
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

  it('renders text, buttons for mix aspirate', () => {
    render(props)
    screen.getByText('Mix before aspirating')
    screen.getByText('Continue')
    screen.getByText('Aspirate and dispense repeatedly before main aspiration')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
    fireEvent.click(screen.getByText('Disabled'))
    screen.getByText('Save')
  })

  it('renders text, buttons for mix dispense', () => {
    props.kind = 'dispense'
    render(props)
    screen.getByText('Mix after dispensing')
    screen.getByText('Save')
    screen.getByText('Aspirate and dispense repeatedly before main aspiration')
    screen.getByText('Enabled')
    screen.getByText('Disabled')
    fireEvent.click(screen.getByText('Enabled'))
    screen.getByText('Continue')
  })

  it('renders text, buttons, input field, and keyboard for mix before aspirating - volume', () => {
    render(props)
    fireEvent.click(screen.getByText('Enabled'))
    fireEvent.click(screen.getByText('Continue'))
    screen.getByText('Mix volume (µL)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    fireEvent.click(screen.getByRole('button', { name: '1' }))
    fireEvent.click(screen.getByRole('button', { name: '1' }))
    fireEvent.click(screen.getByText('Continue'))
    screen.getByText('Value must be between 1 to 10')
  })

  it('renders text, buttons, input field, and keyboard for mix before aspirating - repetitions', () => {
    render(props)
    fireEvent.click(screen.getByText('Enabled'))
    fireEvent.click(screen.getByText('Continue'))
    fireEvent.click(screen.getByText('Continue'))
    screen.getByText('Mix repetitions')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    screen.getByText('Save')
  })

  it('should call dispatch when clicking save button', () => {
    render(props)
    fireEvent.click(screen.getByText('Enabled'))
    fireEvent.click(screen.getByText('Continue'))
    fireEvent.click(screen.getByText('Continue'))
    screen.getByText('Mix repetitions')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    fireEvent.click(screen.getByText('Save'))
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
  it('should call mock function when clicking back button', () => {
    render(props)
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(props.onBack).toHaveBeenCalled()
  })
})

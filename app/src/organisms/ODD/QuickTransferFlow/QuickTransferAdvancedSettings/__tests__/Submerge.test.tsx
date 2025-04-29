import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'

import { Submerge } from '../Submerge'

import type { ComponentProps } from 'react'

vi.mock('/app/redux-resources/analytics')

const render = (props: ComponentProps<typeof Submerge>) => {
  return renderWithProviders(<Submerge {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEventWithRobotSerial: any

describe('Submerge', () => {
  let props: ComponentProps<typeof Submerge>

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

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders text, buttons, input field, and keyboard for submerge before aspirating - speed', () => {
    render(props)
    screen.getByText('Submerge before aspirating')
    screen.getByText('Continue')
    screen.getByText('Lower the tip into the liquid before aspirating')
    screen.getByText('Speed (mm/second)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
  })

  it('renders text, buttons, input field, and keyboard for submerge before aspirating - position', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: '1' }))
    fireEvent.click(screen.getByRole('button', { name: '1' }))
    fireEvent.click(screen.getByText('Continue'))
    screen.getByText('Save')
    screen.getByText('Distance from bottom of well (mm)')
    screen.getByText('Between 0 and 2 mm')
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    screen.getByText('Value must be between 1 to 2')
  })

  it('should call dispatch when clicking save button', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: '1' }))
    fireEvent.click(screen.getByRole('button', { name: '1' }))
    fireEvent.click(screen.getByText('Continue'))
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByText('Save'))
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_SUBMERGE_ASPIRATE',
      submergeSettings: {
        speed: 11,
        positionFromBottom: 22,
      },
    })
  })
  it('should call mock function when clicking back button', () => {
    render(props)
    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(props.onBack).toHaveBeenCalled()
  })
})

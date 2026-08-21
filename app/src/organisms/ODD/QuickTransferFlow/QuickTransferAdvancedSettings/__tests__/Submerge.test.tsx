import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('renders text, buttons, input field, and keyboard for submerge before aspirating - delay duration', async () => {
    render(props)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Continue')
    screen.getByText('Delay duration (seconds)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    screen.getByRole('button', { name: '.' })
  })

  it('renders text, buttons, input field, and keyboard for submerge before aspirating - position', async () => {
    render({
      ...props,
      state: {
        submergeAspirate: { positionReference: 'well-bottom', position: 0 },
      } as any,
    })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Continue')
    screen.getByText('Delay duration (seconds)')
    screen.getByRole('button', { name: '1' })
    screen.getByRole('button', { name: '5' })
    screen.getByRole('button', { name: '9' })
    screen.getByRole('button', { name: 'del' })
    screen.getByRole('button', { name: '.' })
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: '.' }))
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByText('Continue'))
    screen.getByText('Save')
    screen.getByText('Distance from bottom of well (mm)')
    screen.getByText('Between 0 and 3 mm')
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    screen.getByText('Value must be between 0 to 3')
  })

  it('should call dispatch when clicking save button', async () => {
    const user = userEvent.setup()
    props.state.submergeAspirate = {
      speed: 0,
      delayDuration: 0,
      position: 0,
      positionReference: 'well-top',
    }
    render(props)
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByRole('button', { name: '1' }))
    await user.click(screen.getByText('Continue'))
    await user.click(screen.getByRole('button', { name: '0' }))
    await user.click(screen.getByRole('button', { name: '.' }))
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByText('Continue'))
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByRole('button', { name: '2' }))
    await user.click(screen.getByText('Save'))
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'SET_SUBMERGE_ASPIRATE',
      submergeSettings: {
        speed: 11,
        delayDuration: 0.5,
        position: 22,
        positionReference: 'well-top',
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

import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PlayBackControls } from '../'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'

import type { ComponentProps } from 'react'

const mockHandlePlayPause = vi.fn()
const mockSetSelectedCommand = vi.fn()
const mockSetMilliSecondsPerFrame = vi.fn()
const mockOnClickStepDetails = vi.fn()

const defaultProps: ComponentProps<typeof PlayBackControls> = {
  isPlaying: false,
  handlePlayPause: mockHandlePlayPause,
  currentCommandIndex: 0,
  numCommandLength: 5,
  commands: [
    { id: 'cmd-0', commandType: 'comment', params: { message: 'a' } },
    { id: 'cmd-1', commandType: 'comment', params: { message: 'b' } },
    { id: 'cmd-2', commandType: 'comment', params: { message: 'c' } },
    { id: 'cmd-3', commandType: 'comment', params: { message: 'd' } },
    { id: 'cmd-4', commandType: 'comment', params: { message: 'e' } },
  ] as ComponentProps<typeof PlayBackControls>['commands'],
  setSelectedCommand: mockSetSelectedCommand,
  milliSecondsPerFrame: 1000,
  setMilliSecondsPerFrame: mockSetMilliSecondsPerFrame,
  showStepDetails: false,
  onClickStepDetails: mockOnClickStepDetails,
}

const render = (props: Partial<ComponentProps<typeof PlayBackControls>> = {}) => {
  return renderWithProviders(<PlayBackControls {...defaultProps} {...props} />, {
    i18nInstance: i18n,
  })
}

describe('PlayBackControls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tabs through play, speed, and step details buttons', async () => {
    const user = userEvent.setup()
    render()

    const playButton = screen.getByRole('button', { name: 'Play' })
    const speedButton = screen.getByRole('button', {
      name: 'Playback speed, 1x',
    })
    const stepDetailsButton = screen.getByRole('button', {
      name: 'Step details',
    })

    playButton.focus()
    expect(document.activeElement).toBe(playButton)

    await user.tab()
    expect(document.activeElement).toBe(speedButton)

    await user.tab()
    expect(document.activeElement).toBe(stepDetailsButton)
  })
})

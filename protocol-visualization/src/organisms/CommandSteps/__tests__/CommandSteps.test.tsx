import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { CommandSteps } from '../'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { AnnotatedSteps } from '../../AnnotatedSteps'

import type { ComponentProps } from 'react'

vi.mock('../../AnnotatedSteps')

const render = (props: ComponentProps<typeof CommandSteps>) => {
  return renderWithProviders(<CommandSteps {...props} />, {
    i18nInstance: i18n,
  })
}

const mockIntersectionObserver = vi.fn()

describe('CommandSteps', () => {
  let props: ComponentProps<typeof CommandSteps>
  beforeEach(() => {
    props = {
      groupedCommands: null,
      analysis: {} as any,
      setSelectedCommand: vi.fn(),
      percentComplete: 50,
      handlePause: vi.fn(),
      currentCommandIndex: 1,
      milliSecondsPerFrame: 2000,
      isGlobalPlaying: false,
    }
    vi.mocked(AnnotatedSteps).mockReturnValue(<div>mock AnnotatedSteps</div>)
    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null,
    })
    window.IntersectionObserver = mockIntersectionObserver
  })
  it('should render header text', () => {
    render(props)
    screen.getByText('Protocol Steps')
    screen.getByText('50% complete')
  })

  it('should render mock AnnotatedSteps', () => {
    render(props)
    screen.getByText('mock AnnotatedSteps')
  })
})

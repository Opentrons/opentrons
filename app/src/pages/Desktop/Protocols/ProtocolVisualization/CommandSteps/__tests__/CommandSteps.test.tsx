import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { AnnotatedSteps } from '/app/organisms/Desktop/ProtocolDetails/AnnotatedSteps'

import { CommandSteps } from '../'

import type { ComponentProps } from 'react'

vi.mock('/app/organisms/Desktop/ProtocolDetails/AnnotatedSteps')

const render = (props: ComponentProps<typeof CommandSteps>) => {
  return renderWithProviders(<CommandSteps {...props} />, {
    i18nInstance: i18n,
  })
}

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
    }
    vi.mocked(AnnotatedSteps).mockReturnValue(<div>mock AnnotatedSteps</div>)
  })
  it('should render header text', () => {
    render(props)
    screen.getByText('Timeline')
    screen.getByText('50% complete')
  })

  it('should render mock AnnotatedSteps', () => {
    render(props)
    screen.getByText('mock AnnotatedSteps')
  })
})

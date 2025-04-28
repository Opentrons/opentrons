import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CommandText } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { mockFailedCommand, mockRecoveryContentProps } from '../../__fixtures__'
import { StepInfo } from '../StepInfo'

import type { ComponentProps } from 'react'
import type * as OpentronsComponents from '@opentrons/components'

vi.mock('@opentrons/components', async importOriginal => {
  const actualComponents = await importOriginal<typeof OpentronsComponents>()
  return {
    ...actualComponents,
    CommandText: vi.fn(),
  }
})

const render = (props: ComponentProps<typeof StepInfo>) => {
  return renderWithProviders(<StepInfo {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('StepInfo', () => {
  let props: ComponentProps<typeof StepInfo>

  beforeEach(() => {
    props = {
      ...{
        ...mockRecoveryContentProps,
        protocolAnalysis: { commands: [mockFailedCommand] } as any,
      },
      desktopStyle: 'bodyDefaultRegular',
      stepCounts: {
        currentStepNumber: 5,
        totalStepCount: 10,
        hasRunDiverged: false,
      },
    }

    vi.mocked(CommandText).mockReturnValue(<div>MOCK COMMAND TEXT</div>)
  })

  it('renders the step information with the current step and total steps', () => {
    render(props)

    screen.getByText('At step 5/10:')
  })

  it('renders "?" for current step and total steps when they are not available', () => {
    props = {
      ...props,
      stepCounts: {
        currentStepNumber: null,
        totalStepCount: null,
      } as any,
    }
    render(props)

    screen.getByText('At step ?/?:')
  })

  it('renders the CommandText component when the analysis command is found', () => {
    render(props)

    screen.getByText('MOCK COMMAND TEXT')
  })

  it('does not render the CommandText component when the analysis command is not found', () => {
    render(props)

    expect(screen.queryByText('Failed Command')).not.toBeInTheDocument()
  })

  it('does not render the CommandText component when protocolAnalysis is not available', () => {
    props.protocolAnalysis = null
    render(props)

    expect(screen.queryByText('Failed Command')).not.toBeInTheDocument()
  })
})

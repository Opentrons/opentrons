import * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../../__testing-utils__'
import { mockRecoveryContentProps } from '../../__fixtures__'
import { i18n } from '../../../../i18n'
import { StepInfo } from '../StepInfo'
import { CommandText } from '../../../../molecules/Command'

vi.mock('../../../../molecules/Command')

const render = (props: React.ComponentProps<typeof StepInfo>) => {
  return renderWithProviders(<StepInfo {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('StepInfo', () => {
  let props: React.ComponentProps<typeof StepInfo>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
      as: 'h4',
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

import * as React from 'react'
import { describe, it, vi, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { FailedStepNextStep } from '../FailedStepNextStep'
import { Command } from '../../../../molecules/Command'

vi.mock('../../../../molecules/Command')

const render = (props: React.ComponentProps<typeof FailedStepNextStep>) => {
  return renderWithProviders(<FailedStepNextStep {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('FailedStepNextStep', () => {
  let props: React.ComponentProps<typeof FailedStepNextStep>

  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
      isOnDevice: true,
    }

    vi.mocked(Command).mockReturnValue(<div>MOCK_COMMAND</div>)
  })

  it('renders the component with the correct text', () => {
    render(props)
    screen.getByText('Failed step')
    screen.getByText('Next step')
  })

  it('renders the Command component for the failed step and next step', () => {
    render(props)
    expect(vi.mocked(Command)).toHaveBeenCalledWith(
      expect.objectContaining({
        state: 'failed',
        command: props.failedCommand,
        commandTextData: props.protocolAnalysis,
        robotType: props.robotType,
        aligned: 'left',
      }),
      {}
    )
    expect(vi.mocked(Command)).toHaveBeenCalledWith(
      expect.objectContaining({
        state: 'future',
        command: props.commandAfterFailedCommand,
        commandTextData: props.protocolAnalysis,
        robotType: props.robotType,
        aligned: 'left',
      }),
      {}
    )
  })

  it('does not render the Command component if failedCommand or protocolAnalysis is null', () => {
    props = {
      ...props,
      failedCommand: null,
      protocolAnalysis: null,
    }
    render(props)
    expect(screen.queryByText('MOCK_COMMAND')).not.toBeInTheDocument()
  })

  it('does not render the second Command component if commandAfterFailedCommand or protocolAnalysis is null', () => {
    props = {
      ...props,
      commandAfterFailedCommand: null,
      protocolAnalysis: null,
    }
    render(props)
    expect(screen.queryByText('MOCK_COMMAND')).not.toBeInTheDocument()
  })
})

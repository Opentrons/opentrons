import { useTranslation } from 'react-i18next'
import { screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import { i18n } from '../../../../../../i18n'
import { renderWithProviders } from '../../../../../../testing/utils'
import { getSetStatusBarCommandText } from '../getSetStatusBarCommandText'

import type { SetStatusBarRunTimeCommand } from '@opentrons/shared-data'
import type { HandlesCommands } from '../../types'

function TestWrapper({
  command,
}: {
  command: SetStatusBarRunTimeCommand
}): JSX.Element {
  const { t } = useTranslation('protocol_command_text')
  const text = getSetStatusBarCommandText({
    command,
    t,
  } as HandlesCommands<SetStatusBarRunTimeCommand>)

  return <div>{text}</div>
}

const render = (command: any) => {
  return renderWithProviders(<TestWrapper command={command} />, {
    i18nInstance: i18n,
  })
}

describe('getSetStatusBarCommandText', () => {
  it('should render setStatusBar command text for idle animation', () => {
    render({
      id: 'cmd-1',
      commandType: 'setStatusBar',
      params: { animation: 'idle' },
    })

    screen.getByText('Setting status bar animation to idle')
  })

  it('should render setStatusBar command text for confirm animation', () => {
    render({
      id: 'cmd-1',
      commandType: 'setStatusBar',
      params: { animation: 'confirm' },
    })

    screen.getByText('Setting status bar animation to confirm')
  })
})

import { useTranslation } from 'react-i18next'
import { screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import { i18n } from '../../../../../../i18n'
import { renderWithProviders } from '../../../../../../testing/utils'
import { getVacuumRunProfileCommandText } from '../getVacuumRunProfileCommandText'

import type { ReactNode } from 'react'
import type {
  VacuumProfileCycleText,
  VacuumProfileStepText,
} from '../getVacuumRunProfileCommandText'

const baseCommandData = {
  allRunDefs: [],
  robotType: 'OT-3 Standard',
  commandTextData: {
    commands: [],
    labware: [],
    modules: [],
    pipettes: [],
  },
} as any

function TestWrapper({ command }: { command: any }): ReactNode {
  const { t } = useTranslation(['protocol_command_text', 'branded'])
  const result = getVacuumRunProfileCommandText({
    command,
    ...baseCommandData,
    t,
  })
  return (
    <div>
      <span data-testid="commandText">{result.commandText}</span>
      {result.profileElementTexts.map((el, i) =>
        el.kind === 'step' ? (
          <span key={i} data-testid="step">
            {(el as VacuumProfileStepText).stepText}
          </span>
        ) : (
          <div key={i}>
            <span data-testid="cycle">
              {(el as VacuumProfileCycleText).cycleText}
            </span>
            {(el as VacuumProfileCycleText).stepTexts.map((s, j) => (
              <span key={j} data-testid="cycle-step">
                {s.stepText}
              </span>
            ))}
          </div>
        )
      )}
    </div>
  )
}

const render = (command: any) =>
  renderWithProviders(<TestWrapper command={command} />, { i18nInstance: i18n })

describe('getVacuumRunProfileCommandText', () => {
  it('renders header text with element count', () => {
    render({
      commandType: 'vacuumModule/startRunProfile',
      params: {
        moduleId: 'mod-1',
        steps: [
          { gaugePressureMbar: 100, holdSeconds: 10, enablePump: true },
          { percentPower: 50, holdSeconds: 20, enablePump: true },
        ],
      },
    })
    screen.getByText(
      'Running Vacuum Module profile with 2 total steps and cycles:'
    )
  })

  it('renders a pressure step', () => {
    render({
      commandType: 'vacuumModule/startRunProfile',
      params: {
        moduleId: 'mod-1',
        steps: [{ gaugePressureMbar: 200, holdSeconds: 30, enablePump: true }],
      },
    })
    screen.getByText('Pressure: 200mbar, hold time: 0h 00m 30s')
  })

  it('renders a power step', () => {
    render({
      commandType: 'vacuumModule/startRunProfile',
      params: {
        moduleId: 'mod-1',
        steps: [{ percentPower: 75, holdSeconds: 60, enablePump: true }],
      },
    })
    screen.getByText('Power: 75%, hold time: 0h 01m 00s')
  })

  it('renders a cycle with its steps', () => {
    render({
      commandType: 'vacuumModule/startRunProfile',
      params: {
        moduleId: 'mod-1',
        steps: [
          {
            repetitions: 3,
            steps: [
              { gaugePressureMbar: 50, holdSeconds: 5, enablePump: true },
              { percentPower: 25, holdSeconds: 10, enablePump: true },
            ],
          },
        ],
      },
    })
    screen.getByText('3 repetitions of the following steps:')
    screen.getByText('Pressure: 50mbar, hold time: 0h 00m 05s')
    screen.getByText('Power: 25%, hold time: 0h 00m 10s')
  })

  it('handles an empty steps array', () => {
    render({
      commandType: 'vacuumModule/startRunProfile',
      params: { moduleId: 'mod-1', steps: [] },
    })
    screen.getByText(
      'Running Vacuum Module profile with 0 total steps and cycles:'
    )
  })
})

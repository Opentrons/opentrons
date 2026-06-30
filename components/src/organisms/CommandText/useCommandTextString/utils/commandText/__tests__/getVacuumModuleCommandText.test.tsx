import { useTranslation } from 'react-i18next'
import { screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import { i18n } from '../../../../../../i18n'
import { renderWithProviders } from '../../../../../../testing/utils'
import { getVacuumModuleCommandText } from '../getVacuumModuleCommandText'

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

function TestWrapper({ command }: { command: any }): JSX.Element {
  const { t } = useTranslation(['protocol_command_text', 'branded'])
  return (
    <div>{getVacuumModuleCommandText({ command, ...baseCommandData, t })}</div>
  )
}

const render = (command: any) =>
  renderWithProviders(<TestWrapper command={command} />, { i18nInstance: i18n })

describe('getVacuumModuleCommandText', () => {
  describe('vacuumModule/startSetVacuumPressure', () => {
    it('renders pressure without duration', () => {
      render({
        commandType: 'vacuumModule/startSetVacuumPressure',
        params: { moduleId: 'mod-1', gaugePressure: 100 },
      })
      screen.getByText('Setting Vacuum Module to 100mbar')
    })

    it('renders pressure with duration', () => {
      render({
        commandType: 'vacuumModule/startSetVacuumPressure',
        params: { moduleId: 'mod-1', gaugePressure: 50, duration: 30 },
      })
      screen.getByText(
        'Setting Vacuum Module to 50mbar with hold time of 30 seconds after target reached'
      )
    })
  })

  describe('vacuumModule/startSetVacuumPower', () => {
    it('renders power without duration', () => {
      render({
        commandType: 'vacuumModule/startSetVacuumPower',
        params: { moduleId: 'mod-1', percentPower: 75 },
      })
      screen.getByText('Setting Vacuum Module to 75%')
    })

    it('renders power with duration', () => {
      render({
        commandType: 'vacuumModule/startSetVacuumPower',
        params: { moduleId: 'mod-1', percentPower: 75, duration: 60 },
      })
      screen.getByText(
        'Setting Vacuum Module to 75% with hold time of 60 seconds after target reached'
      )
    })
  })

  it('renders stopVacuum', () => {
    render({
      commandType: 'vacuumModule/stopVacuum',
      params: { moduleId: 'mod-1' },
    })
    screen.getByText('Stopping Vacuum Module')
  })

  it('renders openVent', () => {
    render({
      commandType: 'vacuumModule/openVent',
      params: { moduleId: 'mod-1' },
    })
    screen.getByText('Opening Vacuum Module vent')
  })

  it('renders closeVent', () => {
    render({
      commandType: 'vacuumModule/closeVent',
      params: { moduleId: 'mod-1' },
    })
    screen.getByText('Closing Vacuum Module vent')
  })
})

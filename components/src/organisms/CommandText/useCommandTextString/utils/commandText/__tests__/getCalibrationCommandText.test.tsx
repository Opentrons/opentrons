import { useTranslation } from 'react-i18next'
import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { getModuleDisplayName, getPipetteSpecsV2 } from '@opentrons/shared-data'

import { i18n } from '../../../../../../i18n'
import { renderWithProviders } from '../../../../../../testing/utils'
import { getCalibrationCommandText } from '../getCalibrationCommandText'

vi.mock('@opentrons/shared-data')

const baseCommandData = {
  allRunDefs: {},
  robotType: 'OT-3 Standard',
  commandTextData: {
    commands: [],
    labware: [{ id: 'labware-1', displayName: 'Calibration Block' }],
    modules: [
      {
        id: 'module-1',
        model: 'temperatureModuleV2',
        location: { slotName: 'D1' },
      },
    ],
    pipettes: [
      { mount: 'left', pipetteName: 'p1000_single_flex' },
      { mount: 'right', pipetteName: 'p1000_single_flex' },
    ],
  },
} as any

function TestWrapper({ command }: { command: any }): JSX.Element {
  const { t } = useTranslation('protocol_command_text')
  const text = getCalibrationCommandText({
    command,
    ...baseCommandData,
    t,
  })

  return <div>{text}</div>
}

const render = (command: any) => {
  return renderWithProviders(<TestWrapper command={command} />, {
    i18nInstance: i18n,
  })
}

describe('getCalibrationCommandText', () => {
  beforeEach(() => {
    vi.mocked(getModuleDisplayName).mockReturnValue('Temperature Module')
    vi.mocked(getPipetteSpecsV2).mockReturnValue({
      displayName: 'Flex 1-Channel 1000 µL',
    } as any)
  })
  ;(['left', 'right'] as const).forEach(mount => {
    it(`should render calibrate pipette command text for ${mount} mount`, () => {
      render({
        id: 'cmd-1',
        commandType: 'calibration/calibratePipette',
        params: { mount, pipette: '' },
      })

      screen.getByText(`Calibrating Flex 1-Channel 1000 µL on ${mount} mount`)
    })
  })
  ;(['front', 'rear'] as const).forEach(jaw => {
    it(`should render calibrate gripper command text for ${jaw} jaw`, () => {
      render({
        id: 'cmd-1',
        commandType: 'calibration/calibrateGripper',
        params: { jaw },
      })
      screen.getByText(`Calibrating gripper ${jaw} jaw`)
    })
  })

  it('should render calibrate module command text correctly', () => {
    render({
      id: 'cmd-1',
      commandType: 'calibration/calibrateModule',
      params: {
        moduleId: 'module-1',
        labwareId: 'labware-1',
        mount: 'left',
        slot: 'D1',
      },
    })

    screen.getByText(
      'Calibrating Temperature Module in slot D1 using adapter Calibration Block on left mount'
    )
  })
  ;(['left', 'right', 'extension'] as const).forEach(mount => {
    it(`should render move to maintenance position command text for ${mount} mount`, () => {
      render({
        id: 'cmd-1',
        commandType: 'calibration/moveToMaintenancePosition',
        params: { mount },
      })

      const mountLabel =
        mount === 'left'
          ? 'left mount'
          : mount === 'right'
            ? 'right mount'
            : 'extension mount'

      screen.getByText(`Moving ${mountLabel} to maintenance position`)
    })
  })
})

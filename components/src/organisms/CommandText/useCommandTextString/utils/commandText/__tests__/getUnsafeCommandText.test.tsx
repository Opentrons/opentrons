import { useTranslation } from 'react-i18next'
import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import {
  FLEX_STACKER_MODULE_V1,
  getModuleDisplayName,
  getPipetteSpecsV2,
} from '@opentrons/shared-data'

import { i18n } from '../../../../../../i18n'
import { renderWithProviders } from '../../../../../../testing/utils'
import { getLabwareDisplayLocation } from '../../getLabwareDisplayLocation'
import { getUnsafeCommandText } from '../getUnsafeCommandText'

vi.mock('@opentrons/shared-data')
vi.mock('../../getLabwareDisplayLocation')

const baseCommandData = {
  allRunDefs: [],
  robotType: 'OT-3 Standard',
  commandTextData: {
    commands: [],
    labware: [
      {
        id: 'labware-1',
        definitionUri: 'plate-uri',
        displayName: '96 Well Plate',
      },
    ],
    modules: [
      {
        id: 'stacker-1',
        model: FLEX_STACKER_MODULE_V1,
        location: { slotName: 'D4' },
      },
    ],
    pipettes: [{ id: 'pipette-1', pipetteName: 'p1000_single_flex' }],
  },
} as any

function TestWrapper({ command }: { command: any }): JSX.Element {
  const { t } = useTranslation('protocol_command_text')
  const text = getUnsafeCommandText({
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

describe('getUnsafeCommandText', () => {
  beforeEach(() => {
    vi.mocked(getModuleDisplayName).mockReturnValue('Flex Stacker')
    vi.mocked(getPipetteSpecsV2).mockReturnValue({
      displayName: 'Flex 1-Channel 1000 µL',
    } as any)
    vi.mocked(getLabwareDisplayLocation).mockReturnValue('Slot D4')
  })

  it('should render blowOutInPlace command text', () => {
    render({
      id: 'cmd-1',
      commandType: 'unsafe/blowOutInPlace',
      params: { pipetteId: 'pipette-1', flowRate: 12.3456 },
    })

    screen.getByText(
      'Blowing out Flex 1-Channel 1000 µL in place at 12.35 µL/sec'
    )
  })

  it('should render dropTipInPlace command text', () => {
    render({
      id: 'cmd-1',
      commandType: 'unsafe/dropTipInPlace',
      params: { pipetteId: 'pipette-1' },
    })

    screen.getByText('Dropping tip in place')
  })

  it('should render updatePositionEstimators command text', () => {
    render({
      id: 'cmd-1',
      commandType: 'unsafe/updatePositionEstimators',
      params: { axes: ['leftZ', 'x'] },
    })

    screen.getByText('Updating position estimators on left Z, X axes')
  })

  it('should render engageAxes command text', () => {
    render({
      id: 'cmd-1',
      commandType: 'unsafe/engageAxes',
      params: { axes: ['leftPlunger', 'rightPlunger'] },
    })

    screen.getByText('Engaging left plunger, right plunger axes')
  })

  it('should render ungripLabware command text', () => {
    render({
      id: 'cmd-1',
      commandType: 'unsafe/ungripLabware',
      params: {},
    })

    screen.getByText('Homing gripper axis to ungrip labware')
  })

  it('should render placeLabware command text', () => {
    render({
      id: 'cmd-1',
      commandType: 'unsafe/placeLabware',
      params: {
        labwareURI: 'plate-uri',
        location: { slotName: 'D4' },
      },
    })

    screen.getByText('Finishing placing 96 Well Plate in Slot D4 using gripper')
  })

  it('should render manualRetrieve command text', () => {
    render({
      id: 'cmd-1',
      commandType: 'unsafe/flexStacker/manualRetrieve',
      params: { moduleId: 'stacker-1' },
    })

    screen.getByText('Manually retrieve labware from Flex Stacker')
  })

  it('should render closeLatch command text', () => {
    render({
      id: 'cmd-1',
      commandType: 'unsafe/flexStacker/closeLatch',
      params: { moduleId: 'stacker-1' },
    })

    screen.getByText('Closing latch on Flex Stacker')
  })

  it('should render openLatch command text', () => {
    render({
      id: 'cmd-1',
      commandType: 'unsafe/flexStacker/openLatch',
      params: { moduleId: 'stacker-1' },
    })

    screen.getByText('Opening latch on Flex Stacker')
  })

  it('should render prepareShuttle command text', () => {
    render({
      id: 'cmd-1',
      commandType: 'unsafe/flexStacker/prepareShuttle',
      params: { moduleId: 'stacker-1' },
    })

    screen.getByText('Homing shuttle on Flex Stacker')
  })
})

import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'

import { StepSummary } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
  getLiquidEntities,
  getModuleEntities,
} from '../../../../step-forms/selectors'
import { getRobotStateAtActiveItem } from '../../../../top-selectors/labware-locations'
import { getLabwareNicknamesById } from '../../../../ui/labware/selectors'

import type { ComponentProps } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../../../../step-forms/selectors')
vi.mock('../../../../top-selectors/labware-locations')
vi.mock('../../../../ui/labware/selectors')
const render = (props: ComponentProps<typeof StepSummary>) => {
  return renderWithProviders(<StepSummary {...props} />, {
    i18nInstance: i18n,
  })
}

describe('StepSummary', () => {
  let props: ComponentProps<typeof StepSummary>

  beforeEach(() => {
    props = {
      currentStep: {
        id: 'mockId',
        stepType: 'mix',
        labware: 'labware',
        volume: 100,
        times: 2,
        wells: ['A1'],
      },
      stepDetails: 'mockDetails',
    }
    vi.mocked(getLabwareNicknamesById).mockReturnValue({
      labware: 'mockNickName',
    })
    vi.mocked(getLabwareEntities).mockReturnValue({
      labware: {
        id: 'labware',
        labwareDefURI: 'mockUri',
        def: fixture96Plate as LabwareDefinition2,
        pythonName: 'mockPythonName',
      },
    })
    vi.mocked(getLiquidEntities).mockReturnValue({
      liquidId: {
        liquidGroupId: 'liquidId',
        displayColor: '000',
        displayName: 'mockLiquid',
        description: null,
        pythonName: 'mockPythonName',
      },
    })
    vi.mocked(getModuleEntities).mockReturnValue({})
    vi.mocked(getAdditionalEquipmentEntities).mockReturnValue({})
    vi.mocked(getRobotStateAtActiveItem).mockReturnValue({
      liquidState: {
        labware: { labware: { A1: { liquidId: { volume: 100 } } } },
      } as any,
      labware: {},
      modules: {},
      pipettes: {},
      tipState: {} as any,
    })
  })
  it('renders the mix summary with 1 liquid', () => {
    render(props)
    screen.getByText('Mixing')
    screen.getByText('100 µL')
    screen.getByText('of')
    screen.getByText('mockLiquid')
    screen.getByText('2 times in')
    screen.getByText('A1 of mockNickName')
  })
  it('renders the move liquid transfer summary with 2 liquids', () => {
    props = {
      currentStep: {
        id: 'mockId',
        stepType: 'moveLiquid',
        aspirate_labware: 'labware',
        volume: 100,
        dispense_labware: 'labware',
        aspirate_wells: ['A1'],
        dispense_wells: ['A2'],
        path: 'single',
      },
    }
    vi.mocked(getLiquidEntities).mockReturnValue({
      liquidId: {
        liquidGroupId: 'liquidId',
        displayColor: '000',
        displayName: 'mockLiquid',
        description: null,
        pythonName: 'mockPythonName',
      },
      liquidId2: {
        liquidGroupId: 'liquidI2',
        displayColor: '000',
        displayName: 'mockLiquid2',
        description: null,
        pythonName: 'mockPythonName',
      },
    })
    vi.mocked(getRobotStateAtActiveItem).mockReturnValue({
      liquidState: {
        labware: {
          labware: {
            A1: { liquidId: { volume: 100 }, liquidId2: { volume: 10 } },
          },
        },
      } as any,
      labware: {},
      modules: {},
      pipettes: {},
      tipState: {} as any,
    })
    render(props)
    screen.getByText('Transfer')
    screen.getByText('100 µL')
    screen.getByText('of')
    screen.getByText('mockLiquid')
    screen.getByText('and')
    screen.getByText('mockLiquid2')
    screen.getByText('from')
    screen.getByText('mockNickName to')
    screen.getByText('mockNickName')
  })
})

import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import {
  getAdditionalEquipmentEntities,
  getLabwareEntities,
  getLiquidEntities,
  getModuleEntities,
} from '/protocol-designer/step-forms/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'

import { StepSummary } from '..'

import type { ComponentProps } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('/protocol-designer/top-selectors/labware-locations')
vi.mock('/protocol-designer/ui/labware/selectors')
const render = (props: ComponentProps<typeof StepSummary>) => {
  return renderWithProviders(<StepSummary {...props} />, {
    i18nInstance: i18n,
  })
}

describe('StepSummary', () => {
  let props: ComponentProps<typeof StepSummary>
  let baseStackerProps: ComponentProps<typeof StepSummary>

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
    baseStackerProps = {
      currentStep: {
        id: 'retrieve',
        stepType: 'flexStacker',
        flexStackerFormType: 'retrieve',
        fillLabwareUri: 'mockUri',
        fillLabwareIds: ['mock1', 'mock2', 'mock3'],
      },
      labwareEntities: {
        someId: {
          labwareDefURI: 'mockUri',
          def: { metadata: { displayName: 'mockUri' } },
        },
      },
      stepDetails: 'mockDetails',
    } as ComponentProps<typeof StepSummary>

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
  it('renders flex stacker retrieve command summary', () => {
    render(baseStackerProps)
    screen.getByText('Retrieving')
    screen.getByText('ANSI 96 Standard Microplate')
    screen.getByText('from stacker')
  })

  it('renders flex stacker store command summary', () => {
    render({
      ...baseStackerProps,
      currentStep: {
        ...baseStackerProps.currentStep,
        id: 'store',
        flexStackerFormType: 'store',
        stepType: 'flexStacker',
      },
    })
    screen.getByText('Storing')
    screen.getByText('ANSI 96 Standard Microplate')
    screen.getByText('from shuttle into stacker')
  })

  it('renders flex stacker fill command summary', () => {
    render({
      ...baseStackerProps,
      currentStep: {
        ...baseStackerProps.currentStep,
        id: 'fill',
        flexStackerFormType: 'fill',
        stepType: 'flexStacker',
      },
    })
    screen.getByText('Refilling stacker with Quantity:')
    screen.getByText('3')
    screen.getByText('of')
    screen.getByText('ANSI 96 Standard Microplate')
  })

  it('renders flex stacker empty command summary', () => {
    render({
      ...baseStackerProps,
      currentStep: {
        ...baseStackerProps.currentStep,
        id: 'empty',
        flexStackerFormType: 'empty',
        stepType: 'flexStacker',
      },
    })
    screen.getByText('Emptying stacker of all labware')
  })
})

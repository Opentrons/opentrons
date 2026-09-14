import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { fixtureTiprack300ul } from '@opentrons/shared-data'
import { CLEAN, DIRTY, EMPTY } from '@opentrons/step-generation'

import { TipPickupSlot } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'

import type { ComponentProps } from 'react'
import type * as OpentronsComponents from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { RobotState } from '@opentrons/step-generation'
import type { LabwareEntityExtended } from '../../../DeckView'

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof OpentronsComponents>()
  return {
    ...actual,
    LabwareRender: vi.fn(() => <div>mock LabwareRender</div>),
    RobotWorkSpace: vi.fn(({ children }) => (
      <div data-testid="robot-workspace">{children()}</div>
    )),
  }
})

const MOCK_TIPRACK_ID = 'mockTiprackId'
const MOCK_SLOT = 'A1'

const createMockLabwareDef = (): LabwareDefinition2 => {
  return {
    ...fixtureTiprack300ul,
    metadata: {
      ...fixtureTiprack300ul.metadata,
      displayName: 'Mock 300µL Tiprack',
    },
  } as LabwareDefinition2
}

const createMockTiprackEntity = (): LabwareEntityExtended => {
  return {
    id: MOCK_TIPRACK_ID,
    labwareDefURI: 'opentrons/fixture_tiprack_300_ul/1',
    def: createMockLabwareDef(),
    pythonName: 'mock_tiprack',
    nickName: 'mockNickname',
  }
}

const createMockRobotState = (
  tipStateOverrides?: Record<string, 'CLEAN' | 'DIRTY' | 'EMPTY'>
): RobotState => {
  return {
    labware: {
      [MOCK_TIPRACK_ID]: {
        stack: [MOCK_TIPRACK_ID, MOCK_SLOT],
      },
    },
    pipettes: {},
    modules: {},
    liquidState: {
      pipettes: {},
      labware: {},
      trashBins: {},
      wasteChute: {},
    },
    tipState: {
      pipettes: {},
      tipracks:
        tipStateOverrides != null
          ? {
              [MOCK_TIPRACK_ID]: tipStateOverrides,
            }
          : {},
    },
  } as RobotState
}

const render = (props: ComponentProps<typeof TipPickupSlot>) => {
  return renderWithProviders(<TipPickupSlot {...props} />, {
    i18nInstance: i18n,
  })
}

describe('TipPickupSlot', () => {
  let props: ComponentProps<typeof TipPickupSlot>

  beforeEach(() => {
    props = {
      tiprackEntity: createMockTiprackEntity(),
      robotState: createMockRobotState(),
    }
  })

  it('should render TipPickupSlot', () => {
    render(props)
    screen.getByText('mockNickname')
    screen.getByText('mock LabwareRender')
    screen.getByTestId('robot-workspace')
  })

  it('should display tips remaining count when tips are present', () => {
    props.robotState = createMockRobotState({
      A1: CLEAN,
      A2: CLEAN,
      A3: DIRTY,
      B1: EMPTY,
    })
    render(props)
    screen.getByText('Tips remaining')
    screen.getByText('3 tips')
  })

  it('should display zero tips remaining when all tips are empty', () => {
    props.robotState = createMockRobotState({
      A1: EMPTY,
      A2: EMPTY,
    })
    render(props)
    screen.getByText('0 tips')
  })

  it('should handle tiprack with no tipState info', () => {
    props.robotState = createMockRobotState()
    render(props)
    screen.getByText('0 tips')
  })
})

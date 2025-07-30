import { fireEvent, renderHook, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RUN_STATUS_RUNNING, RUN_STATUS_STOPPED } from '@opentrons/api-client'
import { FLEX_ROBOT_TYPE, getLabwareDefURI } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useIsFlex } from '/app/redux-resources/robots'
import { mockTipRackDefinition } from '/app/redux/custom-labware/__fixtures__'

import { MoveLabwareInterventionContent } from '../MoveLabwareInterventionContent'
import {
  mockMoveLabwareCommandFromModule,
  mockMoveLabwareCommandFromSlot,
} from '../__fixtures__'

import type { ComponentProps } from 'react'
import type { RunData } from '@opentrons/api-client'
import type { CompletedProtocolAnalysis, DeckConfiguration } from '@opentrons/shared-data'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { UseQueryResult } from 'react-query'

const ROBOT_NAME = 'Otie'

const mockOnResumeHandler = vi.fn()

vi.mock('/app/redux-resources/robots')

const render = (props: ComponentProps<typeof MoveLabwareInterventionContent>) => {
  return renderWithProviders(<MoveLabwareInterventionContent {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('MoveLabwareInterventionContent', () => {
  let props: ComponentProps<typeof MoveLabwareInterventionContent>

  beforeEach(() => {
    props = {
      run: { id: 'run1' } as RunData,
      analysis: null,
      command: mockMoveLabwareCommandFromModule,
      robotType: FLEX_ROBOT_TYPE,
      isOnDevice: false,
    }
    vi.mocked(useNotifyDeckConfigurationQuery).mockReturnValue(({
      data: [],
    } as unknown) as UseQueryResult<DeckConfiguration>)
    vi.mocked(useIsFlex).mockReturnValue(true)
  })


  it('renders a move labware intervention modal given a move labware command - slot starting point', () => {
    props = {
      ...props,
      command: mockMoveLabwareCommandFromSlot,
      run: {
        labware: [
          {
            id: mockMoveLabwareCommandFromSlot.params.labwareId,
            displayName: 'mockLabware',
            location: { slotName: 'A1' },
            definitionUri: getLabwareDefURI(mockTipRackDefinition),
          },
          {
            id: 'fixedTrash',
            location: { slotName: 'A3' },
            loadName: 'opentrons_1_trash_3200ml_fixed',
          },
        ],
        modules: [],
      } as any,
    }
    render(props)
    screen.getByText('Move labware on Otie')
    screen.getByText('Labware name')
    screen.getByText('mockLabware')
    screen.queryAllByText('A1')
    screen.queryAllByText('D3')
  })

  it('renders a move labware intervention modal given a move labware command - between staging area slots', () => {
    props = {
      ...props,
      command: {
        id: 'mockMoveLabwareCommandId',
        key: 'mockMoveLabwareCommandKey',
        commandType: 'moveLabware',
        params: {
          labwareId: 'mockLabwareId',
          newLocation: {
            addressableAreaName: 'C4',
          },
          strategy: 'manualMoveWithPause',
        },
        startedAt: 'fake_timestamp',
        completedAt: 'fake_timestamp',
        createdAt: 'fake_timestamp',
        status: 'succeeded',
      },
      run: {
        labware: [
          {
            id: 'mockLabwareId',
            displayName: 'mockLabwareInStagingArea',
            location: { slotName: 'B4' },
            definitionUri: getLabwareDefURI(mockTipRackDefinition),
          },
        ],
        modules: [],
      } as any,
    }
    render(props)
    screen.getByText('Move labware on Otie')
    screen.getByText('Labware name')
    screen.getByText('mockLabwareInStagingArea')
    screen.queryAllByText('B4')
    screen.queryAllByText('C4')
  })

  it('renders a move labware intervention modal given a move labware command - module starting point', () => {
    props = {
      ...props,
      command: mockMoveLabwareCommandFromModule,
      run: {
        labware: [
          {
            id: mockMoveLabwareCommandFromModule.params.labwareId,
            displayName: 'mockLabware',
            location: { moduleId: 'mockModuleId' },
            definitionUri: getLabwareDefURI(mockTipRackDefinition),
          },
          {
            id: 'fixedTrash',
            location: { slotName: 'A3' },
            loadName: 'opentrons_1_trash_3200ml_fixed',
          },
        ],
        modules: [
          {
            id: 'mockModuleId',
            model: 'heaterShakerModuleV1',
            location: { slotName: 'C3' },
          },
        ],
      } as any,
    }
    render(props)
    screen.getByText('Move labware on Otie')
    screen.getByText('Labware name')
    screen.getByText('mockLabware')
    screen.queryAllByText('A1')
    screen.queryAllByText('C1')
  })

  it('renders an empty stacker modal', () => {
    props = {
      ...props,
      command: mockEmptyStackerCommand,
      run: {
        labware: [],
        modules: [
          {
            id: mockEmptyStackerCommand.params.moduleId,
            model: 'flexStackerModuleV1',
            location: { slotName: 'C3' },
          },
        ],
      } as any,
    }
    render(props)
    screen.getByText('Empty Stacker')
    screen.queryAllByText('STACKER C3')
  })

  it('renders a fill stacker modal', () => {
    props = {
      ...props,
      command: mockFillStackerCommand,
      run: {
        labware: [],
        modules: [
          {
            id: mockFillStackerCommand.params.moduleId,
            model: 'flexStackerModuleV1',
            location: { slotName: 'C3' },
          },
        ],
      } as any,
    }
    render(props)
    screen.getByText('Refill Stacker')
    screen.queryAllByText('STACKER C3')
  })
})

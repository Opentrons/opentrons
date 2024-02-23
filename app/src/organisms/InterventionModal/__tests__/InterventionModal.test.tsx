import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import {
  CompletedProtocolAnalysis,
  getLabwareDefURI,
} from '@opentrons/shared-data'

import { i18n } from '../../../i18n'
import { InterventionModal } from '..'
import {
  mockPauseCommandWithoutStartTime,
  mockPauseCommandWithStartTime,
  mockMoveLabwareCommandFromSlot,
  mockMoveLabwareCommandFromModule,
  truncatedCommandMessage,
} from '../__fixtures__'
import { mockTipRackDefinition } from '../../../redux/custom-labware/__fixtures__'
import { useIsFlex } from '../../Devices/hooks'

const ROBOT_NAME = 'Otie'

const mockOnResumeHandler = jest.fn()

jest.mock('../../Devices/hooks')

const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>

const render = (props: React.ComponentProps<typeof InterventionModal>) => {
  return renderWithProviders(<InterventionModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('InterventionModal', () => {
  let props: React.ComponentProps<typeof InterventionModal>
  beforeEach(() => {
    props = {
      robotName: ROBOT_NAME,
      command: mockPauseCommandWithStartTime,
      onResume: mockOnResumeHandler,
      run: { labware: [], modules: [] } as any,
      analysis: {
        commands: [
          {
            commandType: 'loadLabware',
            result: { definition: mockTipRackDefinition },
          },
        ],
      } as CompletedProtocolAnalysis,
    }
    mockUseIsFlex.mockReturnValue(true)
  })

  it('renders an InterventionModal with the robot name in the header and confirm button', () => {
    const { getByText, getByRole } = render(props)
    getByText('Pause on Otie')
    // getByText('Learn more about manual steps')
    getByRole('button', { name: 'Confirm and resume' })
  })

  it('renders a pause intervention modal given a pause-type command', () => {
    const { getByText } = render(props)
    getByText(truncatedCommandMessage)
    getByText('Paused for')
    getByText(/[0-9]{2}:[0-9]{2}:[0-9]{2}/)
  })

  it('renders a pause intervention modal with an empty timestamp when no start time given', () => {
    props = { ...props, command: mockPauseCommandWithoutStartTime }
    const { getByText } = render(props)
    getByText('Paused for')
    getByText('--:--:--')
  })

  it('clicking "Confirm and resume" triggers the resume handler', () => {
    const { getByText } = render(props)
    fireEvent.click(getByText('Confirm and resume'))
    expect(mockOnResumeHandler).toHaveBeenCalled()
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
    const { getByText, queryAllByText } = render(props)
    getByText('Move labware on Otie')
    getByText('Labware name')
    getByText('mockLabware')
    queryAllByText('A1')
    queryAllByText('D3')
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
    const { getByText, queryAllByText } = render(props)
    getByText('Move labware on Otie')
    getByText('Labware name')
    getByText('mockLabwareInStagingArea')
    queryAllByText('B4')
    queryAllByText('C4')
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
    const { getByText, queryAllByText } = render(props)
    getByText('Move labware on Otie')
    getByText('Labware name')
    getByText('mockLabware')
    queryAllByText('A1')
    queryAllByText('C1')
  })
})

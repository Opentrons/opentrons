import * as React from 'react'
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

const ROBOT_NAME = 'Otie'

const mockOnResumeHandler = jest.fn()

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
  })

  it('renders an InterventionModal with the robot name in the header, learn more link, and confirm button', () => {
    const { getByText, getByRole } = render(props)
    getByText('Pause on Otie')
    getByText('Learn more about manual steps')
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
    getByText('Confirm and resume').click()
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
    getByText('Labware Name')
    getByText('mockLabware')
    queryAllByText('A1')
    queryAllByText('D3')
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
    getByText('Labware Name')
    getByText('mockLabware')
    queryAllByText('A1')
    queryAllByText('C1')
  })
})

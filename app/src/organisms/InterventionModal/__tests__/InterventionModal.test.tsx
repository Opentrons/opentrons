import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { OT2_STANDARD_MODEL } from '@opentrons/shared-data'
import ot2StandardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'

import { i18n } from '../../../i18n'
import { InterventionModal } from '..'
import {
  mockPauseCommandWithoutStartTime,
  mockPauseCommandWithStartTime,
  mockMoveLabwareCommand,
  truncatedCommandMessage,
} from '../__fixtures__'

const ROBOT_NAME = 'Otie'
const LABWARE_NAME = 'Mock 96 Well Plate'

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
    }
  })

  it('renders an InterventionModal with the robot name in the header, learn more link, and confirm button', () => {
    const { getByText, getByRole } = render(props)
    expect(getByText('Perform manual step on Otie')).toBeTruthy()
    expect(getByText('Learn more about manual steps')).toBeTruthy()
    expect(getByRole('button', { name: 'Confirm and resume' })).toBeTruthy()
  })

  it('renders a pause intervention modal given a pause-type command', () => {
    const { getByText } = render(props)
    expect(getByText(truncatedCommandMessage)).toBeTruthy()
    expect(getByText(/Paused for [0-9]{2}:[0-9]{2}:[0-9]{2}/)).toBeTruthy()
  })

  it('renders a pause intervention modal with an empty timestamp when no start time given', () => {
    props = { ...props, command: mockPauseCommandWithoutStartTime }
    const { getByText } = render(props)
    expect(getByText('Paused for --:--:--')).toBeTruthy()
  })

  it('clicking "Confirm and resume" triggers the resume handler', () => {
    const { getByText } = render(props)
    getByText('Confirm and resume').click()
    expect(mockOnResumeHandler).toHaveBeenCalled()
  })

  it('renders a move labware intervention modal given a move labware command', () => {
    props = {
      ...props,
      command: mockMoveLabwareCommand,
      robotType: OT2_STANDARD_MODEL,
      moduleRenderInfo: [],
      labwareRenderInfo: [],
      labwareName: LABWARE_NAME,
      oldDisplayLocation: 'Slot 1',
      newDisplayLocation: 'Slot 2',
      deckDef: ot2StandardDeckDef as any,
    }
    const { getByText } = render(props)
    getByText('Move Labware')
    getByText('Labware Name')
    getByText('Mock 96 Well Plate')
    getByText('Labware Location')
    getByText('Slot 1 → Slot 2')
  })
})

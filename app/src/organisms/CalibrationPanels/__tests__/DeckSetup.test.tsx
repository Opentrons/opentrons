import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions'
import {
  mockDeckCalTipRack,
  mockTipLengthCalBlock,
} from '../../../redux/sessions/__fixtures__'
import * as Sessions from '../../../redux/sessions'

import { DeckSetup } from '../DeckSetup'

jest.mock('../../../assets/labware/getLabware')
jest.mock('@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions')
jest.mock('@opentrons/components/src/hardware-sim/Deck/RobotWorkSpace', () => ({
  RobotWorkSpace: () => <></>,
}))

const mockGetDeckDefinitions = getDeckDefinitions as jest.MockedFunction<
  typeof getDeckDefinitions
>

describe('DeckSetup', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof DeckSetup>>
  ) => ReturnType<typeof renderWithProviders>

  const mockSendCommands = jest.fn()
  const mockDeleteSession = jest.fn()

  beforeEach(() => {
    mockGetDeckDefinitions.mockReturnValue({})
    render = (props = {}) => {
      const {
        mount = 'left',
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        calBlock = null,
        sendCommands = mockSendCommands,
        cleanUpAndExit = mockDeleteSession,
        currentStep = Sessions.DECK_STEP_LABWARE_LOADED,
        sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
      } = props
      return (
        <DeckSetup
          isMulti={isMulti}
          mount={mount}
          tipRack={tipRack}
          calBlock={calBlock}
          sendCommands={sendCommands}
          cleanUpAndExit={cleanUpAndExit}
          currentStep={currentStep}
          sessionType={sessionType}
        />
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking continue proceeds to next step', () => {
    const {getByRole} = render()[0]

    getByRole('button', {name: 'Confirm placement'}).click()

    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
    })
  })

  it('copy is correct if cal block present for tlc', () => {
    const { getByText, getByRole, queryByText } = render({
      sessionType: Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
      calBlock: mockTipLengthCalBlock,
    })[0]

    getByRole('heading', {name: 'Prepare the space'})
    getByText("Place a full 300ul Tiprack FIXTURE into slot 8")
    getByText("Place the Calibration Block into it's designated slot")
    expect(queryByText('To check the left pipette:')).toBeNull()
    expect(queryByText('Clear all other deck slots')).toBeNull()
  })

  it('copy is correct if cal block not present for tlc', () => {
    const { getByText, getByRole, queryByText } = render({
      sessionType: Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
      calBlock: null,
    })[0]

    getByRole('heading', {name: 'Prepare the space'})
    getByText("Place a full 300ul Tiprack FIXTURE into slot 8")
    expect(queryByText("Place the Calibration Block into it's designated slot")).toBeNull()
    expect(queryByText('To check the left pipette:')).toBeNull()
    expect(queryByText('Clear all other deck slots')).toBeNull()
  })

  it('copy is correct if cal block present for health check', () => {
    const { getByText, getByRole } = render({
      sessionType: Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
      calBlock: mockTipLengthCalBlock,
    })[0]

    getByRole('heading', {name: 'Prepare the space'})
    getByText("Place a full 300ul Tiprack FIXTURE into slot 8")
    getByText("Place the Calibration Block into it's designated slot")
    getByText('To check the left pipette:')
    getByText('Clear all other deck slots')
  })

  it('copy is correct if cal block not present for health check', () => {
    const { getByText, getByRole, queryByText } = render({
      sessionType: Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
      calBlock: null,
    })[0]

    getByRole('heading', {name: 'Prepare the space'})
    getByText("Place a full 300ul Tiprack FIXTURE into slot 8")
    getByText('To check the left pipette:')
    getByText('Clear all other deck slots')
    expect(queryByText("Place the Calibration Block into it's designated slot")).toBeNull()
  })
})

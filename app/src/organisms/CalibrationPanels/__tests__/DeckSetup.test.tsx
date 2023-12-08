import * as React from 'react'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions'
import { i18n } from '../../../i18n'
import {
  mockDeckCalTipRack,
  mockRobotCalibrationCheckSessionDetails,
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
  const mockSendCommands = jest.fn()
  const mockDeleteSession = jest.fn()

  const render = (
    props: Partial<React.ComponentProps<typeof DeckSetup>> = {}
  ) => {
    const {
      mount = 'left',
      isMulti = false,
      tipRack = mockDeckCalTipRack,
      calBlock = null,
      sendCommands = mockSendCommands,
      cleanUpAndExit = mockDeleteSession,
      currentStep = Sessions.DECK_STEP_LABWARE_LOADED,
      sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
      activePipette,
    } = props
    return renderWithProviders(
      <DeckSetup
        isMulti={isMulti}
        mount={mount}
        tipRack={tipRack}
        calBlock={calBlock}
        sendCommands={sendCommands}
        cleanUpAndExit={cleanUpAndExit}
        currentStep={currentStep}
        sessionType={sessionType}
        activePipette={activePipette}
      />,
      { i18nInstance: i18n }
    )
  }



  beforeEach(() => {
    mockGetDeckDefinitions.mockReturnValue({})
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking continue proceeds to next step', () => {
    render()
    screen.getByRole('button', { name: 'Confirm placement' }).click()

    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
    })
  })

  it('copy is correct if cal block present for tlc', () => {
    render({
      sessionType: Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
      calBlock: mockTipLengthCalBlock,
    })

    screen.getByRole('heading', { name: 'Prepare the space' })
    screen.getByText('Place a full 300ul Tiprack FIXTURE into slot 8')
    screen.getByText("Place the Calibration Block into it's designated slot")
    expect(screen.queryByText('To check the left pipette:')).toBeNull()
    expect(screen.queryByText('Clear all other deck slots')).toBeNull()
  })

  it('copy is correct if cal block not present for tlc', () => {
    render({
      sessionType: Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
      calBlock: null,
    })

    screen.getByRole('heading', { name: 'Prepare the space' })
    screen.getByText('Place a full 300ul Tiprack FIXTURE into slot 8')
    expect(
      screen.queryByText("Place the Calibration Block into it's designated slot")
    ).toBeNull()
    expect(screen.queryByText('To check the left pipette:')).toBeNull()
    expect(screen.queryByText('Clear all other deck slots')).toBeNull()
  })

  it('copy is correct if cal block present for health check', () => {
    render({
      sessionType: Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
      calBlock: mockTipLengthCalBlock,
      activePipette: mockRobotCalibrationCheckSessionDetails.activePipette,
    })

    screen.getByRole('heading', { name: 'Prepare the space' })
    screen.getByText('Place a full fake tiprack display name into slot 8')
    screen.getByText("Place the Calibration Block into it's designated slot")
    screen.getByText('To check the left pipette:')
    screen.getByText('Clear all other deck slots')
  })

  it('copy is correct if cal block not present for health check', () => {
    render({
      sessionType: Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
      calBlock: null,
      activePipette: mockRobotCalibrationCheckSessionDetails.activePipette,
    })

    screen.getByRole('heading', { name: 'Prepare the space' })
    screen.getByText('Place a full fake tiprack display name into slot 8')
    screen.getByText('To check the left pipette:')
    screen.getByText('Clear all other deck slots')
    expect(
      screen.queryByText("Place the Calibration Block into it's designated slot")
    ).toBeNull()
  })
})

// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import * as Fixtures from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'
import { ReturnTip } from '../ReturnTip'

const mockSessionDetails = Fixtures.mockRobotCalibrationCheckSessionDetails

describe('ReturnTip', () => {
  let render
  let mockSendCommands

  const getContinueButton = wrapper =>
    wrapper.find('button[title="confirmReturnTip"]')

  beforeEach(() => {
    mockSendCommands = jest.fn()

    render = (props: $Shape<React.ElementProps<typeof ReturnTip>> = {}) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = Fixtures.mockDeckCalTipRack,
        calBlock = null,
        sendCommands = mockSendCommands,
        cleanUpAndExit = jest.fn(),
        currentStep = Sessions.CHECK_STEP_RESULTS_SUMMARY,
        sessionType = Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
        comparisonsByPipette = mockSessionDetails.comparisonsByPipette,
        instruments = mockSessionDetails.instruments,
        activePipette = mockSessionDetails.activePipette,
      } = props
      return mount(
        <ReturnTip
          isMulti={isMulti}
          mount={pipMount}
          tipRack={tipRack}
          calBlock={calBlock}
          sendCommands={sendCommands}
          cleanUpAndExit={cleanUpAndExit}
          currentStep={currentStep}
          sessionType={sessionType}
          comparisonsByPipette={comparisonsByPipette}
          instruments={instruments}
          activePipette={activePipette}
          checkBothPipettes
        />
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('on continue, if final pipette, return tip and transition ', () => {
    const wrapper = render({
      activePipette: {
        ...mockSessionDetails.activePipette,
        rank: Sessions.CHECK_PIPETTE_RANK_SECOND,
      },
    })
    getContinueButton(wrapper).invoke('onClick')()

    expect(mockSendCommands).toHaveBeenCalledWith(
      { command: Sessions.checkCommands.RETURN_TIP },
      { command: Sessions.checkCommands.TRANSITION }
    )
  })

  it('on continue, if first pipette with diff tip racks, return tip and switch', () => {
    const wrapper = render()
    getContinueButton(wrapper).invoke('onClick')()

    expect(mockSendCommands).toHaveBeenCalledWith(
      { command: Sessions.checkCommands.RETURN_TIP },
      { command: Sessions.checkCommands.CHECK_SWITCH_PIPETTE }
    )
  })

  it('on continue, if first pipette with same tip racks, return tip and switch, then move to ref point', () => {
    const wrapper = render({
      instruments: mockSessionDetails.instruments.map(i => ({
        ...i,
        tipRackLoadName: 'same-tip-rack-name',
      })),
    })
    getContinueButton(wrapper).invoke('onClick')()

    expect(mockSendCommands).toHaveBeenCalledWith(
      { command: Sessions.checkCommands.RETURN_TIP },
      { command: Sessions.checkCommands.CHECK_SWITCH_PIPETTE },
      { command: Sessions.checkCommands.MOVE_TO_REFERENCE_POINT }
    )
  })
})

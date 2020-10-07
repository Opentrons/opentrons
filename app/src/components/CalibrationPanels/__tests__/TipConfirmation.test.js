// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { mockDeckCalTipRack } from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'

import { TipConfirmation } from '../TipConfirmation'

describe('TipConfirmation', () => {
  let render

  const mockSendCommands = jest.fn()
  const mockDeleteSession = jest.fn()

  const getConfirmTipButton = wrapper =>
    wrapper.find('button[title="confirmTipAttachedButton"]')

  const getInvalidateTipButton = wrapper =>
    wrapper.find('button[title="invalidateTipButton"]')

  beforeEach(() => {
    render = (
      props: $Shape<React.ElementProps<typeof TipConfirmation>> = {}
    ) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        sendCommands = mockSendCommands,
        cleanUpAndExit = mockDeleteSession,
        currentStep = Sessions.DECK_STEP_INSPECTING_TIP,
        sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
      } = props
      return mount(
        <TipConfirmation
          isMulti={isMulti}
          mount={pipMount}
          tipRack={tipRack}
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

  it('clicking invalidate tip send invalidate tip command', () => {
    const wrapper = render()

    getInvalidateTipButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.INVALIDATE_TIP,
    })
  })
  it('contents are correct for pipette offset calibration ', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
    })
    expect(wrapper.text()).toContain('Yes, move to slot 5')
    getConfirmTipButton(wrapper).invoke('onClick')()
    wrapper.update()

    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.MOVE_TO_DECK,
    })
  })
  it('contents are correct for deck calibration ', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
    })
    expect(wrapper.text()).toContain('Yes, move to slot 5')
    getConfirmTipButton(wrapper).invoke('onClick')()
    wrapper.update()

    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.MOVE_TO_DECK,
    })
  })
  it('contents are correct for tip length calibration ', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
    })
    expect(wrapper.text()).toContain('Yes, move to measure tip length')
    getConfirmTipButton(wrapper).invoke('onClick')()
    wrapper.update()

    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.MOVE_TO_REFERENCE_POINT,
    })
  })
})

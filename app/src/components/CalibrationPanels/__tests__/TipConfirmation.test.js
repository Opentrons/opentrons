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
    wrapper.find('button[children="Yes, move to slot 5"]')

  const getInvalidateTipButton = wrapper =>
    wrapper.find('button[children="No, try again"]')

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

  it('clicking confirm tip attached sends pick up tip command', () => {
    const wrapper = render()

    getConfirmTipButton(wrapper).invoke('onClick')()
    wrapper.update()

    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.MOVE_TO_DECK,
    })
  })
  it('clicking invalidate tip send invalidate tip command', () => {
    const wrapper = render()

    getInvalidateTipButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.INVALIDATE_TIP,
    })
  })
})

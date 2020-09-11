// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { mockDeckCalTipRack } from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'

import { CompleteConfirmation } from '../CompleteConfirmation'

describe('CompleteConfirmation', () => {
  let render

  const mockSendCommand = jest.fn()
  const mockDeleteSession = jest.fn()

  const getContinueButton = wrapper =>
    wrapper.find('button[title="Return tip to tip rack and exit"]')

  beforeEach(() => {
    jest.useFakeTimers()
    render = (
      props: $Shape<React.ElementProps<typeof CompleteConfirmation>> = {}
    ) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        sendSessionCommand = mockSendCommand,
        deleteSession = mockDeleteSession,
        currentStep = Sessions.DECK_STEP_SESSION_STARTED,
        sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
      } = props
      return mount(
        <CompleteConfirmation
          isMulti={isMulti}
          mount={pipMount}
          tipRack={tipRack}
          sendSessionCommand={sendSessionCommand}
          deleteSession={deleteSession}
          currentStep={currentStep}
          sessionType={sessionType}
        />
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('clicking continue sends exit command and deletes session', () => {
    const wrapper = render()

    expect(wrapper.find('ConfirmClearDeckModal').exists()).toBe(false)
    getContinueButton(wrapper).invoke('onClick')()
    wrapper.update()
    jest.runAllTimers()
    expect(mockDeleteSession).toHaveBeenCalled()
    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.sharedCalCommands.EXIT
    )
  })

  it('pip offset cal session type shows correct text', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
    })
    expect(wrapper.text()).toContain('Pipette offset calibration complete')
  })

  it('deck cal session type shows correct text', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
    })
    expect(wrapper.text()).toContain('Deck calibration complete')
  })
})

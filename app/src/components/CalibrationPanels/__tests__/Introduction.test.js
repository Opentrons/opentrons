// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { mockDeckCalTipRack } from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'

import { Introduction } from '../Introduction'

describe('Introduction', () => {
  let render

  const mockSendCommand = jest.fn()
  const mockDeleteSession = jest.fn()

  const getContinueButton = wrapper =>
    wrapper
      .find('PrimaryButton[children="Continue to calibrate deck"]')
      .find('button')

  const getCancelDeckClearButton = wrapper =>
    wrapper.find('OutlineButton[children="cancel"]').find('button')

  const getConfirmDeckClearButton = wrapper =>
    wrapper.find('OutlineButton[children="continue"]').find('button')

  beforeEach(() => {
    render = (props: $Shape<React.ElementProps<typeof Introduction>> = {}) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        sendSessionCommand = mockSendCommand,
        deleteSession = mockDeleteSession,
        currentStep = Sessions.DECK_STEP_SESSION_STARTED,
      } = props
      return mount(
        <Introduction
          isMulti={isMulti}
          mount={pipMount}
          tipRack={tipRack}
          sendSessionCommand={sendSessionCommand}
          deleteSession={deleteSession}
          currentStep={currentStep}
        />
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking continue launches clear deck warning then confirm proceeds to next step', () => {
    const wrapper = render()

    expect(wrapper.find('ConfirmClearDeckModal').exists()).toBe(false)
    getContinueButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(wrapper.find('ConfirmClearDeckModal').exists()).toBe(true)

    getConfirmDeckClearButton(wrapper).invoke('onClick')()

    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.deckCalCommands.LOAD_LABWARE
    )
  })

  it('clicking continue launches clear deck warning then cancel closes modal', () => {
    const wrapper = render()

    expect(wrapper.find('ConfirmClearDeckModal').exists()).toBe(false)
    getContinueButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(wrapper.find('ConfirmClearDeckModal').exists()).toBe(true)

    getCancelDeckClearButton(wrapper).invoke('onClick')()

    expect(wrapper.find('ConfirmClearDeckModal').exists()).toBe(false)
    expect(mockSendCommand).not.toHaveBeenCalledWith(
      Sessions.deckCalCommands.LOAD_LABWARE
    )
  })
})

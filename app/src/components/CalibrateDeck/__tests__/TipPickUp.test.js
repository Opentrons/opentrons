// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import { mockDeckCalTipRack } from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'

import { TipPickUp } from '../TipPickUp'

describe('TipPickUp', () => {
  let render

  const mockSendCommand = jest.fn()
  const mockDeleteSession = jest.fn()

  const getPickUpTipButton = wrapper =>
    wrapper.find('PrimaryButton[children="Pick up tip"]').find('button')

  const getJogButton = (wrapper, direction) =>
    wrapper.find(`JogButton[name="${direction}"]`).find('button')

  beforeEach(() => {
    render = (props: $Shape<React.ElementProps<typeof TipPickUp>> = {}) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        sendSessionCommand = mockSendCommand,
        deleteSession = mockDeleteSession,
        currentStep = Sessions.DECK_STEP_PREPARING_PIPETTE,
      } = props
      return mount(
        <TipPickUp
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

  it('allows jogging in z axis', () => {
    const wrapper = render()

    const jogDirections = ['left', 'right', 'back', 'forward', 'up', 'down']
    const jogVectorsByDirection = {
      up: [0, 0, 0.1],
      down: [0, 0, -0.1],
      left: [-0.1, 0, 0],
      right: [0.1, 0, 0],
      back: [0, 0.1, 0],
      forward: [0, -0.1, 0],
    }
    jogDirections.forEach(direction => {
      act(() => getJogButton(wrapper, direction).invoke('onClick')())
      wrapper.update()

      expect(mockSendCommand).toHaveBeenCalledWith(
        Sessions.deckCalCommands.JOG,
        { vector: jogVectorsByDirection[direction] },
        false
      )
    })
  })
  it('clicking pick up tip sends pick up tip command', () => {
    const wrapper = render()

    act(() => getPickUpTipButton(wrapper).invoke('onClick')())
    wrapper.update()
    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.deckCalCommands.PICK_UP_TIP
    )
  })
})

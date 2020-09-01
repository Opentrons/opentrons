// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import type { Mount } from '@opentrons/components'

import { mockDeckCalTipRack } from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'
import { SaveXYPoint } from '../SaveXYPoint'

const currentStepBySlot = {
  '1': Sessions.DECK_STEP_SAVING_POINT_ONE,
  '3': Sessions.DECK_STEP_SAVING_POINT_TWO,
  '7': Sessions.DECK_STEP_SAVING_POINT_THREE,
}
describe('SaveXYPoint', () => {
  let render

  const mockSendCommand = jest.fn()
  const mockDeleteSession = jest.fn()

  const getSaveButton = (wrapper, direction) =>
    wrapper.find('button[data-test="saveButton"]')

  const getJogButton = (wrapper, direction) =>
    wrapper.find(`JogButton[name="${direction}"]`).find('button')

  const getVideo = wrapper => wrapper.find(`source`)

  beforeEach(() => {
    render = (props = {}) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        sendSessionCommand = mockSendCommand,
        deleteSession = mockDeleteSession,
        currentStep = Sessions.DECK_STEP_SAVING_POINT_ONE,
        sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
      } = props
      return mount(
        <SaveXYPoint
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
  })

  it('displays proper asset', () => {
    const slot1LeftMultiSrc = 'SLOT_1_LEFT_MULTI_X-Y.webm'
    const slot1LeftSingleSrc = 'SLOT_1_LEFT_SINGLE_X-Y.webm'
    const slot1RightMultiSrc = 'SLOT_1_RIGHT_MULTI_X-Y.webm'
    const slot1RightSingleSrc = 'SLOT_1_RIGHT_SINGLE_X-Y.webm'
    const slot3LeftMultiSrc = 'SLOT_3_LEFT_MULTI_X-Y.webm'
    const slot3LeftSingleSrc = 'SLOT_3_LEFT_SINGLE_X-Y.webm'
    const slot3RightMultiSrc = 'SLOT_3_RIGHT_MULTI_X-Y.webm'
    const slot3RightSingleSrc = 'SLOT_3_RIGHT_SINGLE_X-Y.webm'
    const slot7LeftMultiSrc = 'SLOT_7_LEFT_MULTI_X-Y.webm'
    const slot7LeftSingleSrc = 'SLOT_7_LEFT_SINGLE_X-Y.webm'
    const slot7RightMultiSrc = 'SLOT_7_RIGHT_MULTI_X-Y.webm'
    const slot7RightSingleSrc = 'SLOT_7_RIGHT_SINGLE_X-Y.webm'
    const assetMap: { [string]: { [Mount]: { ... }, ... }, ... } = {
      '1': {
        left: {
          multi: slot1LeftMultiSrc,
          single: slot1LeftSingleSrc,
        },
        right: {
          multi: slot1RightMultiSrc,
          single: slot1RightSingleSrc,
        },
      },
      '3': {
        left: {
          multi: slot3LeftMultiSrc,
          single: slot3LeftSingleSrc,
        },
        right: {
          multi: slot3RightMultiSrc,
          single: slot3RightSingleSrc,
        },
      },
      '7': {
        left: {
          multi: slot7LeftMultiSrc,
          single: slot7LeftSingleSrc,
        },
        right: {
          multi: slot7RightMultiSrc,
          single: slot7RightSingleSrc,
        },
      },
    }
    Object.keys(assetMap).forEach(slotNumber => {
      const xyStep = assetMap[slotNumber]
      Object.keys(xyStep).forEach(mountString => {
        Object.keys(xyStep[mountString]).forEach(channelString => {
          const wrapper = render({
            pipMount: mountString,
            isMulti: channelString === 'multi',
            currentStep: currentStepBySlot[slotNumber],
          })
          expect(getVideo(wrapper).prop('src')).toEqual(
            xyStep[mountString][channelString]
          )
        })
      })
    })
  })

  it('allows jogging in z axis', () => {
    const wrapper = render()

    const jogDirections = ['left', 'right', 'back', 'forward']
    const jogVectorByDirection = {
      left: [-0.1, 0, 0],
      right: [0.1, 0, 0],
      back: [0, 0.1, 0],
      forward: [0, -0.1, 0],
    }
    jogDirections.forEach(direction => {
      getJogButton(wrapper, direction).invoke('onClick')()
      wrapper.update()

      expect(mockSendCommand).toHaveBeenCalledWith(
        Sessions.sharedCalCommands.JOG,
        {
          vector: jogVectorByDirection[direction],
        },
        false
      )
    })

    const unavailableJogDirections = ['up', 'down']
    unavailableJogDirections.forEach(direction => {
      expect(getJogButton(wrapper, direction)).toEqual({})
    })
  })

  it('deck cal session sends save offset and move to point two commands when current step is savingPointOne', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_ONE,
    })

    expect(wrapper.text()).toContain('slot 1')
    getSaveButton(wrapper).invoke('onClick')()

    wrapper.update()

    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.sharedCalCommands.SAVE_OFFSET
    )
    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.deckCalCommands.MOVE_TO_POINT_TWO
    )
  })

  it('deck cal session sends save offset and move to point three commands when current step is savingPointTwo', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_TWO,
    })

    expect(wrapper.text()).toContain('slot 3')
    getSaveButton(wrapper).invoke('onClick')()
    wrapper.update()

    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.sharedCalCommands.SAVE_OFFSET
    )
    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.deckCalCommands.MOVE_TO_POINT_THREE
    )
  })

  it('deck cal session sends save offset and move to tip rack commands when current step is savingPointThree', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_THREE,
    })

    expect(wrapper.text()).toContain('slot 7')
    getSaveButton(wrapper).invoke('onClick')()
    wrapper.update()

    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.sharedCalCommands.SAVE_OFFSET
    )
    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.sharedCalCommands.MOVE_TO_TIP_RACK
    )
  })

  it('pip offset cal session sends saveOffset when current step is savingPointOne', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
      currentStep: Sessions.PIP_OFFSET_STEP_SAVING_POINT_ONE,
    })
    const allText = wrapper.text()
    expect(allText).toContain('save calibration')
    expect(allText).toContain('slot 1')

    getSaveButton(wrapper).invoke('onClick')()
    wrapper.update()
    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.sharedCalCommands.SAVE_OFFSET
    )
  })
})

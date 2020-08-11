// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import type { Mount } from '@opentrons/components'

import { mockDeckCalTipRack } from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'
import { SaveXYPoint } from '../SaveXYPoint'

describe('SaveXYPoint', () => {
  let render

  const mockSendCommand = jest.fn()
  const mockDeleteSession = jest.fn()

  const getSaveButton = wrapper =>
    wrapper.find('PrimaryButton[children="save x and y-axis"]').find('button')

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
      } = props
      return mount(
        <SaveXYPoint
          isMulti={isMulti}
          mount={pipMount}
          tipRack={tipRack}
          sendSessionCommand={sendSessionCommand}
          deleteSession={deleteSession}
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
          // TODO: IMMEDIATELY Uncomment other channel cases when supported in component
          multi: slot1LeftMultiSrc,
          // single: slot1LeftSingleSrc,
        },
        // TODO: IMMEDIATELY Uncomment other mount cases when supported in component
        // right: {
        //   multi: slot1RightMultiSrc,
        //   single: slot1RightSingleSrc,
        // },
      },
      // TODO: IMMEDIATELY Uncomment other slot cases when supported in component
      // '3': {
      //   left: {
      //     multi: slot3LeftMultiSrc,
      //     single: slot3LeftSingleSrc,
      //   },
      //   right: {
      //     multi: slot3RightMultiSrc,
      //     single: slot3RightSingleSrc,
      //   },
      // },
      // '7': {
      //   left: {
      //     multi: slot7LeftMultiSrc,
      //     single: slot7LeftSingleSrc,
      //   },
      //   right: {
      //     multi: slot7RightMultiSrc,
      //     single: slot7RightSingleSrc,
      //   },
      // },
    }
    Object.keys(assetMap).forEach(slotNumber => {
      const xyStep = assetMap[slotNumber]
      Object.keys(xyStep).forEach(mountString => {
        Object.keys(xyStep[mountString]).forEach(channelString => {
          const wrapper = render({
            mount: mountString,
            isMulti: channelString === 'multi',
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
      act(() => getJogButton(wrapper, direction).invoke('onClick')())
      wrapper.update()

      expect(mockSendCommand).toHaveBeenCalledWith(
        Sessions.deckCalCommands.JOG,
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

  it('sends save offset command when primary button is clicked', () => {
    const wrapper = render()

    act(() => getSaveButton(wrapper).invoke('onClick')())
    wrapper.update()

    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.deckCalCommands.SAVE_OFFSET
    )
    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.deckCalCommands.MOVE_TO_POINT_TWO
    )
  })
})

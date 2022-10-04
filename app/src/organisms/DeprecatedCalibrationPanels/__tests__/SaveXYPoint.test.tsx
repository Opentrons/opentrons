import * as React from 'react'
import { mount } from 'enzyme'

import { mockDeckCalTipRack } from '../../../redux/sessions/__fixtures__'
import * as Sessions from '../../../redux/sessions'
import { SaveXYPoint } from '../SaveXYPoint'

import type { Mount } from '@opentrons/components'
import type { ReactWrapper, HTMLAttributes } from 'enzyme'
import type {
  CalibrationSessionStep,
  VectorTuple,
} from '../../../redux/sessions/types'

type ChannelString = 'multi' | 'single'
const currentStepBySlot: { [slotNumber: string]: CalibrationSessionStep } = {
  '1': Sessions.DECK_STEP_SAVING_POINT_ONE,
  '3': Sessions.DECK_STEP_SAVING_POINT_TWO,
  '7': Sessions.DECK_STEP_SAVING_POINT_THREE,
}
describe('SaveXYPoint', () => {
  let render: (
    props?: Partial<
      React.ComponentProps<typeof SaveXYPoint> & { pipMount: Mount }
    >
  ) => ReactWrapper<React.ComponentProps<typeof SaveXYPoint>>

  const mockSendCommands = jest.fn()
  const mockDeleteSession = jest.fn()

  const getSaveButton = (
    wrapper: ReactWrapper<React.ComponentProps<typeof SaveXYPoint>>
  ): ReactWrapper<HTMLAttributes> => wrapper.find('button[title="save"]')

  const getJogButton = (
    wrapper: ReactWrapper<React.ComponentProps<typeof SaveXYPoint>>,
    direction: string
  ): ReactWrapper<HTMLAttributes> =>
    wrapper.find(`button[title="${direction}"]`).find('button')

  const getVideo = (
    wrapper: ReactWrapper<React.ComponentProps<typeof SaveXYPoint>>
  ): ReactWrapper<HTMLAttributes> => wrapper.find(`source`)

  beforeEach(() => {
    render = (props = {}) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        sendCommands = mockSendCommands,
        cleanUpAndExit = mockDeleteSession,
        currentStep = Sessions.DECK_STEP_SAVING_POINT_ONE,
        sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
      } = props
      return mount(
        <SaveXYPoint
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
    const assetMap: {
      [slot: string]: {
        [mount in Mount]: { [channels in ChannelString]: string }
      }
    } = {
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
        Object.keys(xyStep[mountString as Mount]).forEach(channelString => {
          const wrapper = render({
            pipMount: mountString as Mount,
            isMulti: channelString === 'multi',
            currentStep: currentStepBySlot[slotNumber],
          })
          expect(getVideo(wrapper).prop('src')).toEqual(
            xyStep[mountString as Mount][channelString as ChannelString]
          )
        })
      })
    })
  })

  it('allows jogging in z axis', () => {
    const wrapper = render()

    const jogDirections: string[] = ['left', 'right', 'back', 'forward']
    const jogVectorByDirection: { [dir: string]: VectorTuple } = {
      left: [-0.1, 0, 0],
      right: [0.1, 0, 0],
      back: [0, 0.1, 0],
      forward: [0, -0.1, 0],
    }
    jogDirections.forEach(direction => {
      getJogButton(wrapper, direction).invoke('onClick')?.(
        {} as React.MouseEvent
      )
      wrapper.update()

      expect(mockSendCommands).toHaveBeenCalledWith({
        command: Sessions.sharedCalCommands.JOG,
        data: {
          vector: jogVectorByDirection[direction],
        },
      })
    })

    const unavailableJogDirections = ['up', 'down']
    unavailableJogDirections.forEach(direction => {
      expect(getJogButton(wrapper, direction)).toEqual({})
    })
  })

  it('renders need help link', () => {
    const wrapper = render()
    expect(wrapper.find('NeedHelpLink').exists()).toBe(true)
  })

  it('deck cal session sends save offset and move to point two commands when current step is savingPointOne', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_ONE,
    })

    expect(wrapper.text()).toContain('slot 1')
    getSaveButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)

    wrapper.update()

    expect(mockSendCommands).toHaveBeenCalledWith(
      {
        command: Sessions.sharedCalCommands.SAVE_OFFSET,
      },
      {
        command: Sessions.deckCalCommands.MOVE_TO_POINT_TWO,
      }
    )
  })

  it('deck cal session sends save offset and move to point three commands when current step is savingPointTwo', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_TWO,
    })

    expect(wrapper.text()).toContain('slot 3')
    getSaveButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()

    expect(mockSendCommands).toHaveBeenCalledWith(
      {
        command: Sessions.sharedCalCommands.SAVE_OFFSET,
      },
      {
        command: Sessions.deckCalCommands.MOVE_TO_POINT_THREE,
      }
    )
  })

  it('deck cal session sends save offset and move to tip rack commands when current step is savingPointThree', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
      currentStep: Sessions.DECK_STEP_SAVING_POINT_THREE,
    })

    expect(wrapper.text()).toContain('slot 7')
    getSaveButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()

    expect(mockSendCommands).toHaveBeenCalledWith(
      {
        command: Sessions.sharedCalCommands.SAVE_OFFSET,
      },
      {
        command: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
      }
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

    getSaveButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()

    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.SAVE_OFFSET,
    })
  })

  it('renders the confirm crash link', () => {
    const wrapper = render()
    expect(wrapper.find('a[children="Start over"]').exists()).toBe(true)
  })

  it('renders the confirm crash modal when invoked', () => {
    const wrapper = render()
    wrapper.find('a[children="Start over"]').invoke('onClick')?.(
      {} as React.MouseEvent
    )
    wrapper.update()
    expect(wrapper.find('ConfirmCrashRecoveryModal').exists()).toBe(true)
  })
})

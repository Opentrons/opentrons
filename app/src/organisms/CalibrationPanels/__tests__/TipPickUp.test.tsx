import * as React from 'react'
import { mount } from 'enzyme'
import { mockDeckCalTipRack } from '../../../redux/sessions/__fixtures__'
import * as Sessions from '../../../redux/sessions'

import { TipPickUp } from '../TipPickUp'

import type { Mount } from '@opentrons/components'
import type { ReactWrapper } from 'enzyme'
import type { VectorTuple } from '../../../redux/sessions/types'

describe('TipPickUp', () => {
  let render: (
    props?: Partial<
      React.ComponentProps<typeof TipPickUp> & { pipMount: Mount }
    >
  ) => ReactWrapper<React.ComponentProps<typeof TipPickUp>>

  const mockSendCommands = jest.fn()
  const mockDeleteSession = jest.fn()

  const getPickUpTipButton = (
    wrapper: ReactWrapper<React.ComponentProps<typeof TipPickUp>>
  ) => wrapper.find('button[children="Pick up tip"]')

  const getJogButton = (
    wrapper: ReactWrapper<React.ComponentProps<typeof TipPickUp>>,
    direction: string
  ) => wrapper.find(`button[title="${direction}"]`).find('button')

  beforeEach(() => {
    render = (props = {}) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        sendCommands = mockSendCommands,
        cleanUpAndExit = mockDeleteSession,
        currentStep = Sessions.DECK_STEP_PREPARING_PIPETTE,
        sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
      } = props
      return mount(
        <TipPickUp
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

  it('allows jogging in z axis', () => {
    const wrapper = render()

    const jogDirections: string[] = [
      'left',
      'right',
      'back',
      'forward',
      'up',
      'down',
    ]
    const jogVectorsByDirection: { [dir: string]: VectorTuple } = {
      up: [0, 0, 0.1],
      down: [0, 0, -0.1],
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
        data: { vector: jogVectorsByDirection[direction] },
      })
    })
  })
  it('clicking pick up tip sends pick up tip command', () => {
    const wrapper = render()

    getPickUpTipButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()
    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.PICK_UP_TIP,
    })
  })

  it('renders the confirm crash link', () => {
    const wrapper = render()
    expect(wrapper.find('a[children="Start over"]').exists()).toBe(true)
  })

  it('renders need help link', () => {
    const wrapper = render()
    expect(wrapper.find('NeedHelpLink').exists()).toBe(true)
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

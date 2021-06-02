import * as React from 'react'
import { mount } from 'enzyme'
import { mockDeckCalTipRack } from '../../../redux/sessions/__fixtures__'
import * as Sessions from '../../../redux/sessions'

import { CompleteConfirmation } from '../CompleteConfirmation'

import type { Mount } from '@opentrons/components'
import type { ReactWrapper } from 'enzyme'

describe('CompleteConfirmation', () => {
  let render: (
    props?: Partial<
      React.ComponentProps<typeof CompleteConfirmation> & { pipMount: Mount }
    >
  ) => ReactWrapper<React.ComponentProps<typeof CompleteConfirmation>>

  const mockSendCommands = jest.fn()
  const mockCleanUpAndExit = jest.fn()

  const getContinueButton = (
    wrapper: ReactWrapper<React.ComponentProps<typeof CompleteConfirmation>>
  ) => wrapper.find('button[title="Return tip to tip rack and exit"]')

  beforeEach(() => {
    render = (props = {}) => {
      const {
        pipMount = 'left' as const,
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        sendCommands = mockSendCommands,
        cleanUpAndExit = mockCleanUpAndExit,
        currentStep = Sessions.DECK_STEP_SESSION_STARTED,
        sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
      } = props
      return mount(
        <CompleteConfirmation
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

  it('clicking continue sends exit command and deletes session', () => {
    const wrapper = render()

    getContinueButton(wrapper).invoke('onClick')?.({} as React.MouseEvent)
    wrapper.update()

    expect(mockCleanUpAndExit).toHaveBeenCalled()
  })

  it('renders need help link', () => {
    const wrapper = render()
    expect(wrapper.find('NeedHelpLink').exists()).toBe(true)
  })

  it('pip offset cal session type shows correct text', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
    })
    expect(wrapper.text()).toContain('Pipette Offset Calibration complete')
  })

  it('deck cal session type shows correct text', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_DECK_CALIBRATION,
    })
    expect(wrapper.text()).toContain('Deck Calibration complete')
  })

  it('tip length cal session type shows correct text', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
    })
    expect(wrapper.text()).toContain('Tip Length Calibration complete')
  })
})

import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import { getDeckDefinitions } from '@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions'
import {
  mockDeckCalTipRack,
  mockTipLengthCalBlock,
} from '../../../redux/sessions/__fixtures__'
import * as Sessions from '../../../redux/sessions'

import { DeckSetup } from '../DeckSetup'

import type { ReactWrapper } from 'enzyme'
import type { Mount } from '@opentrons/components'

jest.mock('../../../assets/labware/getLabware')
jest.mock('@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions')
jest.mock('@opentrons/components/src/hardware-sim/Deck/RobotWorkSpace', () => ({
  RobotWorkSpace: () => <></>,
}))

const mockGetDeckDefinitions = getDeckDefinitions as jest.MockedFunction<
  typeof getDeckDefinitions
>

describe('DeckSetup', () => {
  let render: (
    props?: Partial<
      React.ComponentProps<typeof DeckSetup> & { pipMount: Mount }
    >
  ) => ReactWrapper<React.ComponentProps<typeof DeckSetup>>

  const mockSendCommands = jest.fn()
  const mockDeleteSession = jest.fn()

  beforeEach(() => {
    mockGetDeckDefinitions.mockReturnValue({})
    render = (props = {}) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        calBlock = null,
        sendCommands = mockSendCommands,
        cleanUpAndExit = mockDeleteSession,
        currentStep = Sessions.DECK_STEP_LABWARE_LOADED,
        sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
      } = props
      return mount(
        <DeckSetup
          isMulti={isMulti}
          mount={pipMount}
          tipRack={tipRack}
          calBlock={calBlock}
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

  it('clicking continue proceeds to next step', () => {
    const wrapper = render()

    act(() => wrapper.find('button').invoke('onClick')?.({} as any))
    wrapper.update()

    expect(mockSendCommands).toHaveBeenCalledWith({
      command: Sessions.sharedCalCommands.MOVE_TO_TIP_RACK,
    })
  })

  it('copy is correct if cal block present', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
      calBlock: mockTipLengthCalBlock,
    })
    expect(wrapper.text()).toContain(
      'Clear the deck and place a full 300ul Tiprack FIXTURE and Calibration Block on'
    )
  })

  it('copy is correct if cal block not present', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
      calBlock: null,
    })
    expect(wrapper.text()).toContain(
      'Clear the deck and place a full 300ul Tiprack FIXTURE on'
    )
  })
})

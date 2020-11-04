// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import {
  mockDeckCalTipRack,
  mockTipLengthCalBlock,
} from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'

import { DeckSetup } from '../DeckSetup'

jest.mock('../../../getLabware')
jest.mock('@opentrons/components/src/deck/getDeckDefinitions')
jest.mock('@opentrons/components/src/deck/RobotWorkSpace', () => ({
  RobotWorkSpace: () => <></>,
}))

const mockGetDeckDefinitions: JestMockFn<
  [],
  $Call<typeof getDeckDefinitions, any>
> = getDeckDefinitions

describe('DeckSetup', () => {
  let render

  const mockSendCommands = jest.fn()
  const mockDeleteSession = jest.fn()

  beforeEach(() => {
    mockGetDeckDefinitions.mockReturnValue({})
    render = (props: $Shape<React.ElementProps<typeof DeckSetup>> = {}) => {
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

    act(() => wrapper.find('button').invoke('onClick')())
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
      'Clear the deck and place a full Opentrons GEB 300uL Tiprack and Calibration Block on'
    )
  })

  it('copy is correct if cal block not present', () => {
    const wrapper = render({
      sessionType: Sessions.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
      calBlock: null,
    })
    expect(wrapper.text()).toContain(
      'Clear the deck and place a full Opentrons GEB 300uL Tiprack on'
    )
  })
})

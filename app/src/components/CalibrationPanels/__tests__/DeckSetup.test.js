// @flow
import * as React from 'react'
import { mount } from 'enzyme'
import { act } from 'react-dom/test-utils'
import { mockDeckCalTipRack } from '../../../sessions/__fixtures__'
import * as Sessions from '../../../sessions'

import { DeckSetup } from '../DeckSetup'

jest.mock('../../../getLabware')

jest.mock('@opentrons/components/src/deck/RobotWorkSpace', () => ({
  RobotWorkSpace: () => <></>,
}))

describe('DeckSetup', () => {
  let render

  const mockSendCommand = jest.fn()
  const mockDeleteSession = jest.fn()

  beforeEach(() => {
    render = (props: $Shape<React.ElementProps<typeof DeckSetup>> = {}) => {
      const {
        pipMount = 'left',
        isMulti = false,
        tipRack = mockDeckCalTipRack,
        sendSessionCommand = mockSendCommand,
        deleteSession = mockDeleteSession,
        currentStep = Sessions.DECK_STEP_LABWARE_LOADED,
        sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
      } = props
      return mount(
        <DeckSetup
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

  it('clicking continue proceeds to next step', () => {
    const wrapper = render()

    act(() => wrapper.find('button').invoke('onClick')())
    wrapper.update()

    expect(mockSendCommand).toHaveBeenCalledWith(
      Sessions.sharedCalCommands.MOVE_TO_TIP_RACK
    )
  })
})

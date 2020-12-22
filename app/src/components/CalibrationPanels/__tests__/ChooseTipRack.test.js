// @flow
import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'

import { mockAttachedPipette } from '../../../pipettes/__fixtures__'
import { mockDeckCalTipRack } from '../../../sessions/__fixtures__'
import { mockTipRackDefinition } from '../../../custom-labware/__fixtures__'
import * as Sessions from '../../../sessions'

import { getTipLengthCalibrations } from '../../../calibration'
import { getCustomTipRackDefinitions } from '../../../custom-labware'
import { getAttachedPipettes } from '../../../pipettes'

import { ChooseTipRack } from '../ChooseTipRack'
import type { State } from '../../../types'
import type { AttachedPipettesByMount } from '../../../pipettes/types'

jest.mock('../../../pipettes/selectors')
jest.mock('../../../calibration/tip-length/selectors')
jest.mock('../../../custom-labware/selectors')

const mockAttachedPipettes: AttachedPipettesByMount = ({
  left: mockAttachedPipette,
  right: null,
}: any)

const mockGetTipLengthCalibrations: JestMockFn<
  [State, string],
  $Call<typeof getTipLengthCalibrations, State, string>
> = getTipLengthCalibrations

const mockGetAttachedPipettes: JestMockFn<
  [State, string],
  $Call<typeof getAttachedPipettes, State, string>
> = getAttachedPipettes

const mockGetCustomTipRackDefinitions: JestMockFn<
  [State],
  $Call<typeof getCustomTipRackDefinitions, State>
> = getCustomTipRackDefinitions

describe('ChooseTipRack', () => {
  let render

  const getUseThisTipRackBUtton = wrapper =>
    wrapper.find('button[data-test="useThisTipRackButton"]')

  beforeEach(() => {
    mockGetTipLengthCalibrations.mockReturnValue([])
    mockGetAttachedPipettes.mockReturnValue(mockAttachedPipettes)
    mockGetCustomTipRackDefinitions.mockReturnValue([
      mockTipRackDefinition,
      mockDeckCalTipRack.definition,
    ])

    render = (props: $Shape<React.ElementProps<typeof ChooseTipRack>> = {}) => {
      const {
        tipRack = mockDeckCalTipRack,
        mount = 'left',
        sessionType = Sessions.SESSION_TYPE_DECK_CALIBRATION,
        chosenTipRack = null,
        handleChosenTipRack = jest.fn(),
        closeModal = jest.fn(),
        robotName = 'opentrons',
      } = props
      return mountWithStore(
        <ChooseTipRack
          tipRack={tipRack}
          mount={mount}
          sessionType={sessionType}
          chosenTipRack={chosenTipRack}
          handleChosenTipRack={handleChosenTipRack}
          closeModal={closeModal}
          robotName={robotName}
        />
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Deck calibration shows correct text', () => {
    const { wrapper } = render()
    const allText = wrapper.text()
    expect(allText).toContain('calibrate your Deck')
    expect(getUseThisTipRackBUtton(wrapper).exists()).toBe(true)
  })

  it('Pipette offset calibration shows correct text', () => {
    const { wrapper } = render({
      sessionType: Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
    })
    const allText = wrapper.text()
    expect(allText).toContain('calibrate your Pipette Offset')
    expect(getUseThisTipRackBUtton(wrapper).exists()).toBe(true)
  })
})

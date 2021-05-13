// @flow
import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'

import { mockAttachedPipette } from '../../../redux/pipettes/__fixtures__'
import { mockDeckCalTipRack } from '../../../redux/sessions/__fixtures__'
import { mockTipRackDefinition } from '../../../redux/custom-labware/__fixtures__'
import * as Sessions from '../../../redux/sessions'

import {
  getCalibrationForPipette,
  getTipLengthForPipetteAndTiprack,
  getTipLengthCalibrations,
} from '../../../redux/calibration'
import { getCustomTipRackDefinitions } from '../../../redux/custom-labware'
import { getAttachedPipettes } from '../../../redux/pipettes'

import { ChooseTipRack } from '../ChooseTipRack'
import type { State } from '../../../redux/types'
import type { AttachedPipettesByMount } from '../../../redux/pipettes/types'

jest.mock('../../../redux/pipettes/selectors')
jest.mock('../../../redux/calibration/')
jest.mock('../../../redux/custom-labware/selectors')

const mockAttachedPipettes: AttachedPipettesByMount = ({
  left: mockAttachedPipette,
  right: null,
}: any)

const mockGetCalibrationForPipette: JestMockFn<
  [State, string, string, string],
  $Call<typeof getCalibrationForPipette, State, string, string, string>
> = getCalibrationForPipette

const mockGetTipLengthForPipetteAndTiprack: JestMockFn<
  [State, string, string, string],
  $Call<typeof getTipLengthForPipetteAndTiprack, State, string, string, string>
> = getTipLengthForPipetteAndTiprack

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

  const getUseThisTipRackButton = wrapper =>
    wrapper.find('button[data-test="useThisTipRackButton"]')

  beforeEach(() => {
    mockGetCalibrationForPipette.mockReturnValue(null)
    mockGetTipLengthForPipetteAndTiprack.mockReturnValue(null)
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
    expect(getUseThisTipRackButton(wrapper).exists()).toBe(true)
  })

  it('Pipette offset calibration shows correct text', () => {
    const { wrapper } = render({
      sessionType: Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
    })
    const allText = wrapper.text()
    expect(allText).toContain('calibrate your Pipette Offset')
    expect(getUseThisTipRackButton(wrapper).exists()).toBe(true)
  })
})

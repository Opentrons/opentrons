import * as React from 'react'
import { mountWithStore } from '@opentrons/components'

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
import type { AttachedPipettesByMount } from '../../../redux/pipettes/types'
import type { ReactWrapper } from 'enzyme'
import type { WrapperWithStore } from '@opentrons/components'

jest.mock('../../../redux/pipettes/selectors')
jest.mock('../../../redux/calibration/')
jest.mock('../../../redux/custom-labware/selectors')

const mockAttachedPipettes: AttachedPipettesByMount = {
  left: mockAttachedPipette,
  right: null,
} as any

const mockGetCalibrationForPipette = getCalibrationForPipette as jest.MockedFunction<
  typeof getCalibrationForPipette
>

const mockGetTipLengthForPipetteAndTiprack = getTipLengthForPipetteAndTiprack as jest.MockedFunction<
  typeof getTipLengthForPipetteAndTiprack
>

const mockGetTipLengthCalibrations = getTipLengthCalibrations as jest.MockedFunction<
  typeof getTipLengthCalibrations
>

const mockGetAttachedPipettes = getAttachedPipettes as jest.MockedFunction<
  typeof getAttachedPipettes
>

const mockGetCustomTipRackDefinitions = getCustomTipRackDefinitions as jest.MockedFunction<
  typeof getCustomTipRackDefinitions
>

describe('ChooseTipRack', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof ChooseTipRack>>
  ) => WrapperWithStore<React.ComponentProps<typeof ChooseTipRack>>

  const getUseThisTipRackButton = (
    wrapper: ReactWrapper<React.ComponentProps<typeof ChooseTipRack>>
  ): ReactWrapper => wrapper.find('button[data-test="useThisTipRackButton"]')

  beforeEach(() => {
    mockGetCalibrationForPipette.mockReturnValue(null)
    mockGetTipLengthForPipetteAndTiprack.mockReturnValue(null)
    mockGetTipLengthCalibrations.mockReturnValue([])
    mockGetAttachedPipettes.mockReturnValue(mockAttachedPipettes)
    mockGetCustomTipRackDefinitions.mockReturnValue([
      mockTipRackDefinition,
      mockDeckCalTipRack.definition,
    ])

    render = (props = {}) => {
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

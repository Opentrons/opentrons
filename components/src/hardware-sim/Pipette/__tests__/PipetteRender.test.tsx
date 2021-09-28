import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { render } from '@testing-library/react'
import _uncasted_fixtureTiprack300Ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import {
  anyProps,
  partialComponentPropsMatcher,
} from '../../../../__utils__/matchers'
import { RobotCoordsForeignDiv } from '../../Deck/RobotCoordsForeignDiv'
import { PipetteRender } from '../PipetteRender'
import { EmanatingNozzle } from '../EmanatingNozzle'
import { EightEmanatingNozzles } from '../EightEmanatingNozzles'
import {
  SINGLE_CHANNEL_PIPETTE_WIDTH,
  SINGLE_CHANNEL_PIPETTE_HEIGHT,
  MULTI_CHANNEL_PIPETTE_WIDTH,
  MULTI_CHANNEL_PIPETTE_HEIGHT,
} from '../constants'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

jest.mock('../../Deck/RobotCoordsForeignDiv')
jest.mock('../EmanatingNozzle')
jest.mock('../EightEmanatingNozzles')

const fixtureTiprack300Ul = _uncasted_fixtureTiprack300Ul as LabwareDefinition2

const mockRobotCoordsForeignDiv = RobotCoordsForeignDiv as jest.MockedFunction<
  typeof RobotCoordsForeignDiv
>

const mockEmanatingNozzle = EmanatingNozzle as jest.MockedFunction<
  typeof EmanatingNozzle
>

const mockEightEmanatingNozzles = EightEmanatingNozzles as jest.MockedFunction<
  typeof EightEmanatingNozzles
>

describe('PipetteRender', () => {
  beforeEach(() => {
    when(mockRobotCoordsForeignDiv).mockReturnValue(<div></div>)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  describe('when the pipette is single channel', () => {
    beforeEach(() => {
      when(mockRobotCoordsForeignDiv)
        .calledWith(
          partialComponentPropsMatcher({
            width: SINGLE_CHANNEL_PIPETTE_WIDTH,
            height: SINGLE_CHANNEL_PIPETTE_HEIGHT,
          })
        )
        .mockImplementation(({ children }) => (
          <div>
            {`rectangle with width ${SINGLE_CHANNEL_PIPETTE_WIDTH} and height ${SINGLE_CHANNEL_PIPETTE_HEIGHT}`}{' '}
            {children}
          </div>
        ))

      when(mockEmanatingNozzle)
        .calledWith(anyProps)
        .mockReturnValue(<div>mock emanating nozzle</div>)
    })

    it('should render a rectangle with the correct dimensions', () => {
      const { getByText } = render(
        <PipetteRender
          labwareDef={fixtureTiprack300Ul}
          pipetteName={'p1000_single'}
        />
      )
      getByText(
        `rectangle with width ${SINGLE_CHANNEL_PIPETTE_WIDTH} and height ${SINGLE_CHANNEL_PIPETTE_HEIGHT}`
      )
      mockEmanatingNozzle.mockRestore()
    })
    it('should render a single emanating nozzle', () => {
      const { getByText } = render(
        <PipetteRender
          labwareDef={fixtureTiprack300Ul}
          pipetteName={'p1000_single'}
        />
      )
      getByText('mock emanating nozzle')
      expect(mockEightEmanatingNozzles).not.toHaveBeenCalled()
    })
  })
  describe('when the pipette is 8 channel', () => {
    beforeEach(() => {
      when(mockRobotCoordsForeignDiv)
        .calledWith(
          partialComponentPropsMatcher({
            width: MULTI_CHANNEL_PIPETTE_WIDTH,
            height: MULTI_CHANNEL_PIPETTE_HEIGHT,
          })
        )
        .mockImplementation(({ children }) => (
          <div>
            {`rectangle with width ${MULTI_CHANNEL_PIPETTE_WIDTH} and height ${MULTI_CHANNEL_PIPETTE_HEIGHT}`}{' '}
            {children}
          </div>
        ))

      when(mockEightEmanatingNozzles)
        .calledWith(anyProps)
        .mockReturnValue(<div>mock eight emanating nozzles</div>)
    })
    it('should render a rectangle with the correct dimensions', () => {
      const { getByText } = render(
        <PipetteRender
          labwareDef={fixtureTiprack300Ul}
          pipetteName={'p10_multi'}
        />
      )
      getByText(
        `rectangle with width ${MULTI_CHANNEL_PIPETTE_WIDTH} and height ${MULTI_CHANNEL_PIPETTE_HEIGHT}`
      )
      mockEightEmanatingNozzles.mockRestore()
    })
    it('should render eight emanating nozzles', () => {
      const { getByText } = render(
        <PipetteRender
          labwareDef={fixtureTiprack300Ul}
          pipetteName={'p10_multi'}
        />
      )
      getByText('mock eight emanating nozzles')
    })
  })
})

import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import {
  RobotWorkSpace,
  useInterval,
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'
import { i18n } from '../../../../i18n'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { LabwareDefinition2 } from '@opentrons/shared-data'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import { useModuleRenderInfoById, useLabwareRenderInfoById } from '../../hooks'
import { SectionList } from '../SectionList'
import { useIntroInfo, useLabwareIdsBySection } from '../hooks'
import { IntroScreen, INTERVAL_MS } from '../IntroScreen'
import type { Section } from '../types'
import { fireEvent } from '@testing-library/dom'

jest.mock('../hooks')
jest.mock('../Sectionlist')
jest.mock('../../hooks')
jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    RobotWorkSpace: jest.fn(() => <div>mock RobotWorkSpace</div>),
    useInterval: jest.fn(),
  }
})

const mockUseModuleRenderInfoById = useModuleRenderInfoById as jest.MockedFunction<
  typeof useModuleRenderInfoById
>
const mockUseLabwareRenderInfoById = useLabwareRenderInfoById as jest.MockedFunction<
  typeof useLabwareRenderInfoById
>
const mockUseLabwareIdsBySection = useLabwareIdsBySection as jest.MockedFunction<
  typeof useLabwareIdsBySection
>
const mockUseIntroInfo = useIntroInfo as jest.MockedFunction<
  typeof useIntroInfo
>
const mockUseInterval = useInterval as jest.MockedFunction<typeof useInterval>
const mockSectionList = SectionList as jest.MockedFunction<typeof SectionList>
const mockRobotWorkSpace = RobotWorkSpace as jest.MockedFunction<
  typeof RobotWorkSpace
>
const deckSlotsById = standardDeckDef.locations.orderedSlots.reduce(
  (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
  {}
)
const MOCK_SECTIONS = ['MOCK_PRIMARY_PIPETTE_TIPRACKS' as Section]
const MOCK_300_UL_TIPRACK_COORDS = [30, 40, 0]

const render = (props: React.ComponentProps<typeof IntroScreen>) => {
  return renderWithProviders(<IntroScreen {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('IntroScreen', () => {
  let props: React.ComponentProps<typeof IntroScreen>

  beforeEach(() => {
    props = {
      setCurrentLabwareCheckStep: jest.fn(),
    }
    when(mockRobotWorkSpace)
      .mockReturnValue(<div></div>) // this (default) empty div will be returned when RobotWorkSpace isn't called with expected props
      .calledWith(
        partialComponentPropsMatcher({
          deckDef: standardDeckDef,
          children: expect.anything(),
        })
      )
      .mockImplementation(({ children }) => (
        <svg>
          {/* @ts-expect-error children won't be null since we checked for expect.anything() above */}
          {children({
            deckSlotsById,
            getRobotCoordsFromDOMCoords: {} as any,
          })}
        </svg>
      ))
    when(mockUseLabwareRenderInfoById)
      .calledWith()
      .mockReturnValue({
        '300_ul_tiprack_id': {
          labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
          x: MOCK_300_UL_TIPRACK_COORDS[0],
          y: MOCK_300_UL_TIPRACK_COORDS[1],
          z: MOCK_300_UL_TIPRACK_COORDS[2],
        },
      })
    when(mockUseLabwareIdsBySection).calledWith().mockReturnValue({})
    when(mockUseModuleRenderInfoById).calledWith().mockReturnValue({})

    when(mockUseIntroInfo).calledWith().mockReturnValue({
      primaryTipRackSlot: '1',
      primaryTipRackName: 'Opentrons 96 Tip Rack 300 µL',
      primaryPipetteMount: 'left',
      secondaryPipetteMount: '',
      numberOfTips: 1,
      firstStepLabwareSlot: '2',
      sections: MOCK_SECTIONS,
    })
    mockSectionList.mockReturnValue(<div>Mock Section List</div>)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('renders correct heading and position_check_description', () => {
    const { getByRole, getByText } = render(props)
    getByRole('heading', {
      name: 'Labware Position Check Overview',
    })
    getByText(
      'Labware Position Check is a guided workflow that checks every labware on the deck for an added degree of precision in your protocol.'
    )
    getByText(
      'When you check a labware, the OT-2’s pipette nozzle or attached tip will stop at the center of the A1 well. If the pipette nozzle or tip is not centered, you can reveal the OT-2’s jog controls to make an adjustment. This Labware Offset will be applied to the entire labware. Offset data is measured to the nearest 1/10th mm and can be made in the X, Y and/or Z directions.'
    )
    getByText('Mock Section List')
  })
  it('should call setCurrentLabwareCheckStep when the CTA button is pressed', () => {
    const { getByRole } = render(props)
    expect(props.setCurrentLabwareCheckStep).not.toHaveBeenCalled()
    const genericStepScreenButton = getByRole('button', {
      name: 'begin labware position check, move to Slot 2',
    })
    fireEvent.click(genericStepScreenButton)
    expect(props.setCurrentLabwareCheckStep).toHaveBeenCalled()
  })
  it('should should rotate through the active section', () => {
    render(props)
    expect(mockUseInterval.mock.calls[0][1]).toBe(INTERVAL_MS)
  })
})

import * as React from 'react'
import { fireEvent } from '@testing-library/dom'
import { when, resetAllWhenMocks } from 'jest-when'
import {
  RobotWorkSpace,
  useInterval,
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'
import { i18n } from '../../../../i18n'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import { LabwareDefinition2 } from '@opentrons/shared-data'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import {
  useLabwareRenderInfoForRunById,
  useModuleRenderInfoForProtocolById,
} from '../../../Devices/hooks'
import { useCurrentRun, useCurrentRunId } from '../../../ProtocolUpload/hooks'
import { getLatestLabwareOffsetCount } from '../../deprecatedUtils/getLatestLabwareOffsetCount'
import { DeprecatedSectionList } from '../DeprecatedSectionList'
import { useIntroInfo, useLabwareIdsBySection } from '../../deprecatedHooks'
import { DeprecatedIntroScreen, INTERVAL_MS } from '../DeprecatedIntroScreen'
import type { DeprecatedSection } from '../types'
import type { HostConfig, LabwareOffset } from '@opentrons/api-client'

jest.mock('../../deprecatedHooks')
jest.mock('../DeprecatedSectionList')
jest.mock('../../../Devices/hooks')
jest.mock('../../../ProtocolUpload/hooks')
jest.mock('../../utils/getLatestLabwareOffsetCount')

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    RobotWorkSpace: jest.fn(() => <div>mock RobotWorkSpace</div>),
    useInterval: jest.fn(),
  }
})
jest.mock('@opentrons/react-api-client')

const mockUseLabwareRenderInfoForRunById = useLabwareRenderInfoForRunById as jest.MockedFunction<
  typeof useLabwareRenderInfoForRunById
>
const mockUseModuleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById as jest.MockedFunction<
  typeof useModuleRenderInfoForProtocolById
>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>
const mockUseLabwareIdsBySection = useLabwareIdsBySection as jest.MockedFunction<
  typeof useLabwareIdsBySection
>
const mockUseIntroInfo = useIntroInfo as jest.MockedFunction<
  typeof useIntroInfo
>
const mockUseInterval = useInterval as jest.MockedFunction<typeof useInterval>
const mockDeprecatedSectionList = DeprecatedSectionList as jest.MockedFunction<
  typeof DeprecatedSectionList
>
const mockRobotWorkSpace = RobotWorkSpace as jest.MockedFunction<
  typeof RobotWorkSpace
>
const mockUseCurrentRun = useCurrentRun as jest.MockedFunction<
  typeof useCurrentRun
>
const mockGetLatestLabwareOffsetCount = getLatestLabwareOffsetCount as jest.MockedFunction<
  typeof getLatestLabwareOffsetCount
>

const deckSlotsById = standardDeckDef.locations.orderedSlots.reduce(
  (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
  {}
)
const MOCK_DEPRECATED_SECTIONS = [
  'MOCK_PRIMARY_PIPETTE_TIPRACKS' as DeprecatedSection,
]
const MOCK_300_UL_TIPRACK_COORDS = [30, 40, 0]
const MOCK_ROBOT_NAME = 'otie'
const HOST_CONFIG: HostConfig = {
  hostname: 'localhost',
  robotName: MOCK_ROBOT_NAME,
}
const MOCK_RUN_ID = 'fakeRunId'

const render = (props: React.ComponentProps<typeof DeprecatedIntroScreen>) => {
  return renderWithProviders(<DeprecatedIntroScreen {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('DeprecatedIntroScreen', () => {
  let props: React.ComponentProps<typeof DeprecatedIntroScreen>
  let mockOffsets: LabwareOffset[]

  beforeEach(() => {
    props = {
      beginLPC: jest.fn(),
    }
    mockOffsets = [
      {
        id: 'someId',
        createdAt: 'someTimestamp',
        definitionUri: 'some_def_uri',
        location: { slotName: '4' },
        vector: { x: 1, y: 1, z: 1 },
      },
    ]
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
    when(mockUseLabwareRenderInfoForRunById)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue({
        '300_ul_tiprack_id': {
          labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
          displayName: 'fresh tips',
          x: MOCK_300_UL_TIPRACK_COORDS[0],
          y: MOCK_300_UL_TIPRACK_COORDS[1],
          z: MOCK_300_UL_TIPRACK_COORDS[2],
        },
      })
    when(mockUseLabwareIdsBySection).calledWith(MOCK_RUN_ID).mockReturnValue({})
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(MOCK_ROBOT_NAME, MOCK_RUN_ID)
      .mockReturnValue({})
    when(mockUseCurrentRunId).calledWith().mockReturnValue(MOCK_RUN_ID)
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)

    when(mockUseIntroInfo).calledWith().mockReturnValue({
      primaryPipetteMount: 'left',
      secondaryPipetteMount: '',
      firstTiprackSlot: '2',
      sections: MOCK_DEPRECATED_SECTIONS,
    })
    mockDeprecatedSectionList.mockReturnValue(
      <div>Mock DeprecatedSection List</div>
    )
    when(mockUseCurrentRun)
      .calledWith()
      .mockReturnValue({
        data: { id: MOCK_RUN_ID, labwareOffsets: mockOffsets },
      } as any)
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
    getByText('Mock DeprecatedSection List')
  })
  it('should call beginLPC when the CTA button is pressed', () => {
    const { getByRole } = render(props)
    expect(props.beginLPC).not.toHaveBeenCalled()
    const genericStepScreenButton = getByRole('button', {
      name: 'begin labware position check, move to Slot 2',
    })
    fireEvent.click(genericStepScreenButton)
    expect(props.beginLPC).toHaveBeenCalled()
  })
  it('should should rotate through the active section', () => {
    render(props)
    expect(mockUseInterval.mock.calls[0][1]).toBe(INTERVAL_MS)
  })
  it('should not render offset deletion alert if there are no previous offsets', () => {
    when(mockGetLatestLabwareOffsetCount)
      .calledWith(mockOffsets)
      .mockReturnValue(0)
    const { queryByText } = render(props)
    expect(
      queryByText(
        'Once you begin Labware Position Check, previously created Labware Offsets will be discarded.'
      )
    ).toBeNull()
  })
})

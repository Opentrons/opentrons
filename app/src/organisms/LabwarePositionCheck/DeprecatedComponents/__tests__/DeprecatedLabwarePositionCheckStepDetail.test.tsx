import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import '@testing-library/jest-dom'
import { fireEvent, screen } from '@testing-library/react'
import { useCommandQuery } from '@opentrons/react-api-client'
import {
  Coordinates,
  getIsTiprack,
  getPipetteNameSpecs,
} from '@opentrons/shared-data'
import {
  RobotWorkSpace,
  componentPropsMatcher,
  partialComponentPropsMatcher,
  renderWithProviders,
  LabwareRender,
  PipetteRender,
  anyProps,
  C_BLUE,
  WELL_LABEL_OPTIONS,
} from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { DeprecatedJogControls } from '../../../../molecules/DeprecatedJogControls'
import { OffsetVector } from '../../../../molecules/OffsetVector'
import { useProtocolDetailsForRun } from '../../../Devices/hooks'
import { DeprecatedLabwarePositionCheckStepDetail } from '../DeprecatedLabwarePositionCheckStepDetail'
import { useLabwareOffsetForLabware } from '../../deprecatedHooks/useLabwareOffsetForLabware'
import { DeprecatedStepDetailText } from '../DeprecatedStepDetailText'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    RobotWorkSpace: jest.fn(() => <div>mock RobotWorkSpace</div>),
    LabwareRender: jest.fn(() => <div>mock LabwareRender</div>),
    PipetteRender: jest.fn(() => <div>mock PipetteRender</div>),
  }
})
jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    getPipetteNameSpecs: jest.fn(),
    getIsTiprack: jest.fn(),
  }
})
jest.mock('@opentrons/react-api-client')
jest.mock('../../../../molecules/DeprecatedJogControls')
jest.mock('../../../Devices/hooks')
jest.mock('../../deprecatedHooks/useLabwareOffsetForLabware')
jest.mock('../DeprecatedStepDetailText')
jest.mock('../../../../molecules/OffsetVector')

const mockDeprecatedStepDetailText = DeprecatedStepDetailText as jest.MockedFunction<
  typeof DeprecatedStepDetailText
>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockGetPipetteNameSpecs = getPipetteNameSpecs as jest.MockedFunction<
  typeof getPipetteNameSpecs
>
const mockGetIsTiprack = getIsTiprack as jest.MockedFunction<
  typeof getIsTiprack
>
const mockUseCommandQuery = useCommandQuery as jest.MockedFunction<
  typeof useCommandQuery
>
const mockUseLabwareOffsetForLabware = useLabwareOffsetForLabware as jest.MockedFunction<
  typeof useLabwareOffsetForLabware
>

const mockRobotWorkSpace = RobotWorkSpace as jest.MockedFunction<
  typeof RobotWorkSpace
>
const mockLabwareRender = LabwareRender as jest.MockedFunction<
  typeof LabwareRender
>
const mockPipetteRender = PipetteRender as jest.MockedFunction<
  typeof PipetteRender
>
const mockOffsetVector = OffsetVector as jest.MockedFunction<
  typeof OffsetVector
>
const mockJogControls = DeprecatedJogControls as jest.MockedFunction<
  typeof DeprecatedJogControls
>
const PICKUP_TIP_LABWARE_ID = 'PICKUP_TIP_LABWARE_ID'
const PRIMARY_PIPETTE_ID = 'PRIMARY_PIPETTE_ID'
const PRIMARY_PIPETTE_NAME = 'PRIMARY_PIPETTE_NAME'
const TIPRACK_DEF_URI = 'TIPRACK_DEF'
const LABWARE_DEF_URI = 'LABWARE_DEF'
const LABWARE_DEF = {
  ordering: [['A1', 'A2']],
}
const MOCK_RUN_ID = 'fakeRunId'
const mockStartingPosition: Coordinates = { x: 1, y: 2, z: 3 }
const mockJoggedToPosition: Coordinates = { x: 2, y: 3, z: 4 }
const mockLabwarePositionCheckStepTipRack = {
  labwareId:
    '1d57fc10-67ad-11ea-9f8b-3b50068bd62d:opentrons/opentrons_96_filtertiprack_200ul/1',
  section: '',
  commands: [
    {
      commandType: 'pickUpTip',
      params: {
        pipetteId: PRIMARY_PIPETTE_ID,
        labwareId: PICKUP_TIP_LABWARE_ID,
      },
    },
  ],
} as any

const render = (
  props: React.ComponentProps<typeof DeprecatedLabwarePositionCheckStepDetail>
) => {
  return renderWithProviders(
    <DeprecatedLabwarePositionCheckStepDetail {...props} />,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('DeprecatedLabwarePositionCheckStepDetail', () => {
  let props: React.ComponentProps<
    typeof DeprecatedLabwarePositionCheckStepDetail
  >
  beforeEach(() => {
    props = {
      selectedStep: mockLabwarePositionCheckStepTipRack,
      jog: jest
        .fn()
        .mockImplementation((_axis, _direction, _step, onSuccess) => {
          onSuccess(mockJoggedToPosition)
        }) as any,
      runId: MOCK_RUN_ID,
      savePositionCommandData: {
        [mockLabwarePositionCheckStepTipRack.labwareId]: ['commandId1'],
      },
    }
    when(mockDeprecatedStepDetailText)
      .calledWith(
        partialComponentPropsMatcher({
          selectedStep: mockLabwarePositionCheckStepTipRack,
        })
      )
      .mockReturnValue(<div>Mock Step Detail Text </div>)
    when(mockUseLabwareOffsetForLabware)
      .calledWith(MOCK_RUN_ID, mockLabwarePositionCheckStepTipRack.labwareId)
      .mockReturnValue(null)
    when(mockUseCommandQuery)
      .calledWith(MOCK_RUN_ID, 'commandId1')
      .mockReturnValue({
        data: {
          data: {
            commandType: 'savePosition',
            result: {
              position: mockStartingPosition,
            },
          },
        },
      } as any)
    when(mockUseProtocolDetailsForRun)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue({
        protocolData: {
          labware: [
            {
              id: mockLabwarePositionCheckStepTipRack.labwareId,
              slot: '1',
              displayName: 'someDislpayName',
              definitionUri: LABWARE_DEF_URI,
              loadName: 'someLoadName',
            },
          ],
          labwareDefinitions: {
            [LABWARE_DEF_URI]: LABWARE_DEF,
          },
          pipettes: [
            {
              id: PRIMARY_PIPETTE_ID,
              pipetteName: PRIMARY_PIPETTE_NAME,
              mount: 'left',
            },
          ],
        },
      } as any)

    when(mockGetPipetteNameSpecs)
      .calledWith(PRIMARY_PIPETTE_NAME as any)
      .mockReturnValue({ channels: 1 } as any)

    mockGetIsTiprack.mockReturnValue(false)

    mockJogControls.mockReturnValue(<div></div>)

    when(mockRobotWorkSpace)
      .mockReturnValue(
        <div>mockRobotWorkSpace not being called with the correct props</div>
      )
      .calledWith(anyProps())
      .mockImplementation(({ children }) => (
        <svg>
          {/* @ts-expect-error children won't be null since we checked for expect.anything() above */}
          {children()}
        </svg>
      ))

    when(mockPipetteRender)
      .mockReturnValue(<div></div>)
      .calledWith(
        partialComponentPropsMatcher({
          labwareDef: LABWARE_DEF,
        })
      )
      .mockReturnValue(<div>mock pipette render</div>)
    when(mockOffsetVector)
      .mockReturnValue(
        <div>mockOffsetVector not being called with the correct props</div>
      )
      .calledWith(anyProps())
      .mockImplementation(props => (
        <div>{`x${props.x},y${props.y},z${props.z}`}</div>
      ))
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })
  it('renders StepDetailText component', () => {
    const { getByText } = render(props)
    getByText('Mock Step Detail Text')
  })
  it('renders the level with labware image', () => {
    render(props)
    screen.getByAltText('level with labware')
  })
  it('renders null if protocol data is null', () => {
    mockUseProtocolDetailsForRun.mockReturnValue({ protocolData: null } as any)
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })
  it('renders the level with tip image', () => {
    mockGetIsTiprack.mockReturnValue(true)

    when(mockUseProtocolDetailsForRun)
      .calledWith(MOCK_RUN_ID)
      .mockReturnValue({
        protocolData: {
          labware: [
            {
              id: mockLabwarePositionCheckStepTipRack.labwareId,
              slot: '1',
              displayName: 'someDislpayName',
              definitionUri: LABWARE_DEF_URI,
              loadName: 'someLoadName',
            },
          ],
          labwareDefinitions: {
            [TIPRACK_DEF_URI]: LABWARE_DEF,
          },
          pipettes: [
            {
              id: PRIMARY_PIPETTE_ID,
              pipetteName: PRIMARY_PIPETTE_NAME,
              mount: 'left',
            },
          ],
        },
      } as any)
    render(props)
    screen.getByAltText('level with tip')
  })
  it('renders a pipette', () => {
    when(mockPipetteRender)
      .calledWith(
        componentPropsMatcher({
          labwareDef: LABWARE_DEF,
          pipetteName: PRIMARY_PIPETTE_NAME,
        })
      )
      .mockReturnValue(<div>mock pipette render</div>)
    const { getByText } = render(props)
    getByText('mock pipette render')
  })
  describe('when pipette is multi channel', () => {
    it('renders labware with stroke, and highlighted labels outside', () => {
      when(mockGetPipetteNameSpecs)
        .calledWith(PRIMARY_PIPETTE_NAME as any)
        .mockReturnValue({ channels: 8 } as any)

      when(mockLabwareRender)
        .mockReturnValue(
          <div>mock labware render not being called with the right props</div>
        )
        .calledWith(
          partialComponentPropsMatcher({
            definition: LABWARE_DEF,
            wellStroke: { A1: C_BLUE, A2: C_BLUE },
            wellLabelOption: WELL_LABEL_OPTIONS.SHOW_LABEL_OUTSIDE,
            highlightedWellLabels: { wells: ['A1', 'A2'] },
          })
        )
        .mockReturnValue(
          <div>
            mock labware with stroke and highlighted well labels outside
          </div>
        )

      const { getByText } = render(props)
      getByText('mock labware with stroke and highlighted well labels outside')
    })
  })
  describe('when pipette is single channel', () => {
    it('renders labware with stroke, and highlighted labels outside', () => {
      when(mockGetPipetteNameSpecs)
        .calledWith(PRIMARY_PIPETTE_NAME as any)
        .mockReturnValue({ channels: 1 } as any)

      when(mockLabwareRender)
        .mockReturnValue(
          <div>mock labware render not being called with the right props</div>
        )
        .calledWith(
          partialComponentPropsMatcher({
            definition: LABWARE_DEF,
            wellStroke: { A1: C_BLUE },
            wellLabelOption: WELL_LABEL_OPTIONS.SHOW_LABEL_OUTSIDE,
            highlightedWellLabels: { wells: ['A1'] },
          })
        )
        .mockReturnValue(
          <div>
            mock labware with stroke and highlighted well labels outside
          </div>
        )

      const { getByText } = render(props)
      getByText('mock labware with stroke and highlighted well labels outside')
    })
  })
  describe('jog controls', () => {
    it('renders correct text when jog controls are hidden', () => {
      const { getByText, getByRole } = render(props)
      getByText('Need to make an adjustment?')
      getByRole('button', { name: 'Reveal jog controls' })
      expect(screen.queryByText('Mock Jog Controls')).toBeNull()
    })
    it('renders correct text when jog controls are revealed', () => {
      mockJogControls.mockReturnValue(<div>Mock Jog Controls</div>)
      const { getByText, getByRole } = render(props)
      getByText('Need to make an adjustment?')
      const revealJogControls = getByRole('button', {
        name: 'Reveal jog controls',
      })
      fireEvent.click(revealJogControls)
      getByText('Mock Jog Controls')
    })
    it('renders identity offset and updates correctly after jog', () => {
      mockJogControls.mockImplementation(props => (
        <button onClick={() => props.jog('x', 1, 1)}>MOCK JOG BUTTON</button>
      ))
      const { getByText, getByRole } = render(props)
      const revealJogControls = getByRole('button', {
        name: 'Reveal jog controls',
      })
      getByText('x0,y0,z0')
      fireEvent.click(revealJogControls)
      const jogButton = getByRole('button', {
        name: 'MOCK JOG BUTTON',
      })
      fireEvent.click(jogButton)
      getByText('x1,y1,z1')
    })
    it('renders existing offset and updates correctly after jog', () => {
      mockJogControls.mockImplementation(props => (
        <button onClick={() => props.jog('x', 1, 1)}>MOCK JOG BUTTON</button>
      ))
      when(mockUseLabwareOffsetForLabware)
        .calledWith(MOCK_RUN_ID, mockLabwarePositionCheckStepTipRack.labwareId)
        .mockReturnValue({
          id: 'fake_offset_id',
          vector: { x: 4, y: 5, z: 6 },
          createdAt: 'fakeTimestamp',
          location: { slotName: '1' },
          definitionUri: 'fakeUri',
        })
      const { getByText, getByRole } = render(props)
      const revealJogControls = getByRole('button', {
        name: 'Reveal jog controls',
      })
      getByText('x4,y5,z6')
      fireEvent.click(revealJogControls)
      const jogButton = getByRole('button', {
        name: 'MOCK JOG BUTTON',
      })
      fireEvent.click(jogButton)
      getByText('x5,y6,z7')
    })
  })
})

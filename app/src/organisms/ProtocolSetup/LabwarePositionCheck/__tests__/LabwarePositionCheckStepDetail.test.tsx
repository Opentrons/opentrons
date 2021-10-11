import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { getPipetteNameSpecs } from '@opentrons/shared-data'
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
import { useProtocolDetails } from '../../../RunDetails/hooks'
import { LabwarePositionCheckStepDetail } from '../LabwarePositionCheckStepDetail'
import { StepDetailText } from '../StepDetailText'

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
  }
})
jest.mock('../../../RunDetails/hooks')
jest.mock('../StepDetailText')

const mockStepDetailText = StepDetailText as jest.MockedFunction<
  typeof StepDetailText
>
const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>
const mockGetPipetteNameSpecs = getPipetteNameSpecs as jest.MockedFunction<
  typeof getPipetteNameSpecs
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

const PICKUP_TIP_LABWARE_ID = 'PICKUP_TIP_LABWARE_ID'
const PRIMARY_PIPETTE_ID = 'PRIMARY_PIPETTE_ID'
const PRIMARY_PIPETTE_NAME = 'PRIMARY_PIPETTE_NAME'
const LABWARE_DEF_ID = 'LABWARE_DEF_ID'
const LABWARE_DEF = {
  ordering: [['A1', 'A2']],
}
const mockLabwarePositionCheckStepTipRack = {
  labwareId:
    '1d57fc10-67ad-11ea-9f8b-3b50068bd62d:opentrons/opentrons_96_filtertiprack_200ul/1',
  section: '',
  commands: [
    {
      command: 'pickUpTip',
      params: {
        pipette: PRIMARY_PIPETTE_ID,
        labware: PICKUP_TIP_LABWARE_ID,
      },
    },
  ],
} as any

const render = (
  props: React.ComponentProps<typeof LabwarePositionCheckStepDetail>
) => {
  return renderWithProviders(<LabwarePositionCheckStepDetail {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('LabwarePositionCheckStepDetail', () => {
  let props: React.ComponentProps<typeof LabwarePositionCheckStepDetail>
  beforeEach(() => {
    props = {
      selectedStep: mockLabwarePositionCheckStepTipRack,
    }
    when(mockStepDetailText)
      .calledWith(
        partialComponentPropsMatcher({
          selectedStep: mockLabwarePositionCheckStepTipRack,
        })
      )
      .mockReturnValue(<div>Mock Step Detail Text </div>)
    when(mockUseProtocolDetails)
      .calledWith()
      .mockReturnValue({
        protocolData: {
          labware: {
            [mockLabwarePositionCheckStepTipRack.labwareId]: {
              slot: '1',
              displayName: 'someDislpayName',
              definitionId: LABWARE_DEF_ID,
            },
          },
          labwareDefinitions: {
            [LABWARE_DEF_ID]: LABWARE_DEF,
          },
          pipettes: {
            [PRIMARY_PIPETTE_ID]: {
              name: PRIMARY_PIPETTE_NAME,
              mount: 'left',
            },
          },
        },
      } as any)

    when(mockGetPipetteNameSpecs)
      .calledWith(PRIMARY_PIPETTE_NAME as any)
      .mockReturnValue({ channels: 1 } as any)

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
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })
  it('renders StepDetailText component', () => {
    const { getByText } = render(props)
    getByText('Mock Step Detail Text')
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
    it('renders labware with with stroke, and highlighted labels outside', () => {
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
    it('renders labware with with stroke, and highlighted labels outside', () => {
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
})

import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import {
  fixture96Plate,
  fixtureP100096V2Specs,
  fixtureTiprack1000ul,
  getLabwareDefURI,
} from '@opentrons/shared-data'

import formDataForSingleStep from '/protocol-designer/__fixtures__/formDataForSingleStep.json'
import propsForFieldsForSingleStep from '/protocol-designer/__fixtures__/propsForFieldsForSingleStep.json'
import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import {
  getAdditionalEquipmentEntities,
  getInitialDeckSetup,
  getInvariantContext,
  getLabwareEntities,
  getPipetteEntities,
} from '/protocol-designer/step-forms/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import {
  ChangeTipField,
  DropTipField,
  LabwareField,
  PathField,
  PickUpTipField,
  PipetteField,
  TiprackField,
  TipWellSelectionField,
  VolumeField,
} from '../../../PipetteFields'
import { FirstStepMoveLiquidTools } from '../FirstStepMoveLiquidTools'

import type { ComponentProps } from 'react'
import type {
  LabwareDefinition,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'

vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('../../../PipetteFields')
vi.mock('/protocol-designer/feature-flags/selectors')
vi.mock('/protocol-designer/file-data/selectors')
vi.mock('/protocol-designer/ui/labware/selectors')
vi.mock('/protocol-designer/ui/modules/selectors')
vi.mock('/protocol-designer/top-selectors/labware-locations')
const labwareId =
  '4d7e45e2-b962-45ca-8ace-8a5a683591d5:opentrons/opentrons_96_wellplate_200ul_pcr_full_skirt/2'
const dispenseLabwareId =
  '83a383e5-6a5a-4dae-9da4-5c21bd3835dc:opentrons/nest_96_wellplate_2ml_deep/2'
const pipetteId = 'mockPipetteId'

const render = (props: ComponentProps<typeof FirstStepMoveLiquidTools>) => {
  return renderWithProviders(<FirstStepMoveLiquidTools {...props} />, {
    i18nInstance: i18n,
  })
}
const DEFAULT_ROBOT_STATE = {
  tipState: { pipettes: { pipetteId: {} } },
  labware: {
    [labwareId]: { stack: [labwareId, 'C1'] },
    [dispenseLabwareId]: { stack: [dispenseLabwareId, 'C2'] },
  },
} as any
const mockInvariantContext = {
  pipetteEntities: {
    [pipetteId]: {
      name: 'p1000_96',
      id: pipetteId,
      tiprackDefURI: [
        getLabwareDefURI(fixtureTiprack1000ul as LabwareDefinition),
      ],
      tiprackLabwareDef: [fixtureTiprack1000ul],
      spec: fixtureP100096V2Specs,
      pythonName: 'mock_pipette_p1000_96',
    },
  },
  labwareEntities: {
    [labwareId]: {
      id: labwareId,
      pythonName: 'mock_source_plate',
      labwareDefURI: getLabwareDefURI(fixture96Plate as LabwareDefinition),
      def: fixture96Plate,
    },
    [dispenseLabwareId]: {
      id: dispenseLabwareId,
      labwareDefURI: 'mockUri',
      pythonName: 'aspirate_labware',
      def: fixture96Plate as LabwareDefinition2,
    },
  },

  stagingAreaEntities: {},
  moduleEntities: {},
} as any
vi.mocked(getInvariantContext).mockReturnValue(mockInvariantContext)
describe('FirstStepMoveLiquidTools', () => {
  let props: ComponentProps<typeof FirstStepMoveLiquidTools>
  beforeEach(() => {
    props = {
      propsForFields: propsForFieldsForSingleStep as any,
      formData: formDataForSingleStep as any,
    }
    vi.mocked(getRobotStateAtActiveItem).mockReturnValue(DEFAULT_ROBOT_STATE)
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      modules: {},
      labware: {
        [labwareId]: {
          id: labwareId,
          labwareDefURI: 'mockUri',
          pythonName: 'aspirate_labware',
          def: fixture96Plate as LabwareDefinition2,
          stack: ['labware', '8'],
        },
        [dispenseLabwareId]: {
          id: dispenseLabwareId,
          labwareDefURI: 'mockUri',
          pythonName: 'aspirate_labware',
          def: fixture96Plate as LabwareDefinition2,
          stack: ['labware', '7'],
        },
      },
      pipettes: {},
      additionalEquipmentOnDeck: {},
    } as AllTemporalPropertiesForTimelineFrame)
    vi.mocked(getLabwareEntities).mockReturnValue({
      labwareId: {
        id: labwareId,
        labwareDefURI: 'mockUri',
        def: fixture96Plate as LabwareDefinition2,
        pythonName: 'mockPythonName',
      },
    })

    vi.mocked(getPipetteEntities).mockReturnValue({
      [pipetteId]: {
        name: 'p50_single_flex',
        spec: {} as any,
        id: pipetteId,
        tiprackLabwareDef: [],
        tiprackDefURI: ['mockDefURI1', 'mockDefURI2'],
        pythonName: 'mockPythonName',
      },
    })
    vi.mocked(getAdditionalEquipmentEntities).mockReturnValue({})
    vi.mocked(PipetteField).mockReturnValue(<div>mock PipetteField</div>)
    vi.mocked(TiprackField).mockReturnValue(<div>mock TiprackField</div>)
    vi.mocked(LabwareField).mockReturnValue(<div>mock LabwareField</div>)
    vi.mocked(VolumeField).mockReturnValue(<div>mock VolumeField</div>)
    vi.mocked(PathField).mockReturnValue(<div>mock PathField</div>)
    vi.mocked(ChangeTipField).mockReturnValue(<div>mock ChangeTipField</div>)
    vi.mocked(DropTipField).mockReturnValue(<div>mock DropTipField</div>)
    vi.mocked(PickUpTipField).mockReturnValue(<div>mock PickUpTipField</div>)
    vi.mocked(TipWellSelectionField).mockReturnValue(
      <div>mock TipWellSelectionField</div>
    )
  })

  it('renders fields', () => {
    render(props)
    screen.getByText('mock PipetteField')
    screen.getByText('mock TiprackField')
    screen.getAllByText('mock LabwareField')
    screen.getByText('mock VolumeField')
    screen.getByText('mock PathField')
  })
})

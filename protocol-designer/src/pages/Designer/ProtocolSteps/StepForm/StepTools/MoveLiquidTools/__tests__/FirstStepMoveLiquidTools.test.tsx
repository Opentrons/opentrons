import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'

import formDataForSingleStep from '/protocol-designer/__fixtures__/formDataForSingleStep.json'
import propsForFieldsForSingleStep from '/protocol-designer/__fixtures__/propsForFieldsForSingleStep.json'
import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import {
  getAdditionalEquipmentEntities,
  getInitialDeckSetup,
  getLabwareEntities,
  getPipetteEntities,
} from '/protocol-designer/step-forms/selectors'

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
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'

vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('../../../PipetteFields')
vi.mock('/protocol-designer/feature-flags/selectors')

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

describe('FirstStepMoveLiquidTools', () => {
  let props: ComponentProps<typeof FirstStepMoveLiquidTools>
  beforeEach(() => {
    props = {
      propsForFields: propsForFieldsForSingleStep as any,
      formData: formDataForSingleStep as any,
    }
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

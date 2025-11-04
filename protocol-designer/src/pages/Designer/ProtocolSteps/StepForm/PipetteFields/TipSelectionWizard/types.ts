import type { Dispatch, SetStateAction } from 'react'
import type {
  DeckDefinition,
  NozzleConfigurationStyle,
  PipetteV2Specs,
} from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms/types'

export interface TipSelectionBaseProps {
  selectedTiprackId: string | null
  setSelectedTiprackId: Dispatch<SetStateAction<string | null>>
  formTiprackUri: string
  activeDeckSetup: AllTemporalPropertiesForTimelineFrame
  deckDef: DeckDefinition
  pipetteSpecs: PipetteV2Specs
  nozzles: NozzleConfigurationStyle
  pipetteId: string
}

export interface PipetteShadowProps {
  x: number
  y: number
  width: number
  height: number
  fill: string
  stroke: string
}

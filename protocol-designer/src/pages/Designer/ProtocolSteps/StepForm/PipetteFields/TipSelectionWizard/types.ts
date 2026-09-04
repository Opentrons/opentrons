import type { Dispatch, SetStateAction } from 'react'
import type {
  DeckDefinition,
  NozzleConfigurationStyle,
  PipetteV2Specs,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms/types'
import type {
  INACCESSIBLE_PARTIAL_TIP,
  INACCESSIBLE_WELL_SPACING_MISMATCH,
} from '../NozzleAndWellSelectionModal/constants'
import type {
  INACCESSIBLE_COLLISION,
  INACCESSIBLE_INCOMPLETE,
  INACCESSIBLE_TOO_MANY_PICKUPS,
  LABEL_PLACEMENT_BOTTOM,
  LABEL_PLACEMENT_LEFT,
  LABEL_PLACEMENT_RIGHT,
  LABEL_PLACEMENT_TOP,
} from './constants'

export interface TipSelectionBaseProps {
  selectedTiprackId: string | null
  setSelectedTiprackId: Dispatch<SetStateAction<string | null>>
  formTiprackUri: string
  activeDeckSetup: AllTemporalPropertiesForTimelineFrame
  deckDef: DeckDefinition
  pipetteSpecs: PipetteV2Specs
  nozzles: NozzleConfigurationStyle
  pipetteId: string
  primaryNozzle: PrimaryNozzleConfigurationStyle
}

export interface PipetteShadowProps {
  x: number
  y: number
  width: number
  height: number
  fill: string
  stroke: string
  rotate?: boolean
}

export type LabelPlacement =
  | typeof LABEL_PLACEMENT_TOP
  | typeof LABEL_PLACEMENT_BOTTOM
  | typeof LABEL_PLACEMENT_LEFT
  | typeof LABEL_PLACEMENT_RIGHT

export type InaccessibleReason =
  | typeof INACCESSIBLE_COLLISION
  | typeof INACCESSIBLE_INCOMPLETE
  | typeof INACCESSIBLE_TOO_MANY_PICKUPS
  | typeof INACCESSIBLE_PARTIAL_TIP
  | typeof INACCESSIBLE_WELL_SPACING_MISMATCH

interface AccessibilityStatusBase {
  affectedWells: string[]
}
interface AccessibleStatus extends AccessibilityStatusBase {
  isAccessible: true
}

interface InaccessibleStatus extends AccessibilityStatusBase {
  isAccessible: false
  inaccessibleReason: InaccessibleReason
}
export type AccessibilityStatus = AccessibleStatus | InaccessibleStatus

export type TipSelectionBannerReason =
  'incompletePickup' | 'pickupsRequired' | 'tooManyTips'

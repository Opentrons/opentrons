import { getColumnFromWellName } from '/protocol-designer/pages/Designer/ProtocolSteps/StepForm/PipetteFields/TipSelectionWizard/utils'

import type { TFunction } from 'i18next'

export function getDeckLabel(
  slotName: string,
  isHopper: boolean,
  t: TFunction
): string {
  if (slotName === 'offDeck') {
    return t('off_deck')
  }

  if (isHopper) {
    return t('shared:stacker', {
      slot: getColumnFromWellName(slotName),
    })
  }

  return slotName
}

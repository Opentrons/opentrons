import { useTranslation } from 'react-i18next'

import { TIP } from '@opentrons/components'

import type { SelectionType } from '@opentrons/components'

export function useLegendItems(
  selectionType: SelectionType
): Array<{ label: string; type: string }> {
  const isSelectionType = selectionType === TIP
  const { t } = useTranslation(
    isSelectionType ? 'tip_selection' : 'well_selection'
  )
  if (selectionType === TIP) {
    return [
      { label: t('legend.new_tip'), type: 'new' },
      { label: t('legend.used_tip'), type: 'used' },
      { label: t('legend.selected_tip'), type: 'selected' },
      { label: t('legend.no_tip'), type: 'no' },
      { label: t('legend.inaccessible_tip'), type: 'inaccessible' },
    ]
  }

  return [
    { label: t('legend.unselected_well'), type: 'unselected' },
    { label: t('legend.selected_well'), type: 'selected' },
    { label: t('legend.inaccessible_tip'), type: 'inaccessible' },
  ]
}

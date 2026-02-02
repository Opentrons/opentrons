import { useTranslation } from 'react-i18next'

import {
  COLORS,
  StyledText,
  TIP,
  TipStatus,
  WellStatus,
} from '@opentrons/components'

import styles from './tipselectionwizard.module.css'

import type { SelectionType, TipType, WellType } from '@opentrons/components'
import type { LabwareDefinition } from '@opentrons/shared-data'

function useLegendItems(
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

interface SelectionLegendProps {
  selectionType: SelectionType
  labwareDefinition: LabwareDefinition
}

export function SelectionLegend({
  selectionType,
  labwareDefinition,
}: SelectionLegendProps): JSX.Element {
  const isTipSelection = selectionType === TIP
  const legendItems = useLegendItems(selectionType)

  return (
    <div className={styles.tip_select_legend_container}>
      {legendItems.map(({ type, label }) => (
        <div key={label} className={styles.tip_select_legend_item}>
          {isTipSelection ? (
            <TipStatus
              type={type as TipType}
              labwareDefinition={labwareDefinition}
            />
          ) : (
            <WellStatus
              type={type as WellType}
              labwareDefinition={labwareDefinition}
            />
          )}

          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {label}
          </StyledText>
        </div>
      ))}
    </div>
  )
}

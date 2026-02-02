import {
  COLORS,
  StyledText,
  TIP,
  TipStatus,
  WellStatus,
} from '@opentrons/components'

import styles from './tipselectionwizard.module.css'
import { useLegendItems } from './useLegendItems'

import type { SelectionType, TipType, WellType } from '@opentrons/components'

interface SelectionLegendProps {
  selectionType: SelectionType
}

export function SelectionLegend({
  selectionType,
}: SelectionLegendProps): JSX.Element {
  const isTipSelection = selectionType === TIP
  const legendItems = useLegendItems(selectionType)

  return (
    <div className={styles.tip_select_legend_container}>
      {legendItems.map(({ type, label }) => (
        <div key={label} className={styles.tip_select_legend_item}>
          {isTipSelection ? (
            <TipStatus type={type as TipType} />
          ) : (
            <WellStatus type={type as WellType} />
          )}

          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {label}
          </StyledText>
        </div>
      ))}
    </div>
  )
}

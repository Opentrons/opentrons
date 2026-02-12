import {
  COLORS,
  StyledText,
  TipStatus,
  WellStatus,
} from '@opentrons/components'
import { fixture96Plate, fixtureTiprack1000ul } from '@opentrons/shared-data'

import styles from './tipselectionwizard.module.css'
import { useLegendItems } from './useLegendItems'

import type { TipType, WellType } from '@opentrons/components'
import type { LabwareDefinition, LabwareWellMap } from '@opentrons/shared-data'

interface SelectionLegendProps {
  selectionType: 'tip' | 'well'
  size?: string
}

export function SelectionLegend({
  selectionType,
  size,
}: SelectionLegendProps): JSX.Element {
  let labwareWellMap: LabwareWellMap
  const isTipSelection = selectionType === 'tip'
  if (isTipSelection) {
    labwareWellMap = fixtureTiprack1000ul.wells as LabwareWellMap
  } else {
    labwareWellMap = fixture96Plate.wells as LabwareWellMap
  }
  const legendItems = useLegendItems(selectionType)

  return (
    <div className={styles.tip_select_legend_container}>
      {legendItems.map(({ type, label }) => (
        <div key={label} className={styles.tip_select_legend_item}>
          {isTipSelection ? (
            <TipStatus
              type={type as TipType}
              wellMap={labwareWellMap}
              size={size}
            />
          ) : (
            <WellStatus
              type={type as WellType}
              wellMap={labwareWellMap}
              size={size}
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

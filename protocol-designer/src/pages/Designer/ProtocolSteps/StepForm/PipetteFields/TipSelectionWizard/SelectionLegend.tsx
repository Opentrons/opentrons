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
import type { LabwareDefinition } from '@opentrons/shared-data'

interface SelectionLegendProps {
  selectionType: 'tip' | 'well'
  size?: string
}

export function SelectionLegend({
  selectionType,
  size,
}: SelectionLegendProps): JSX.Element {
  let labwareDefinition: LabwareDefinition
  const isTipSelection = selectionType === 'tip'
  if (isTipSelection) {
    labwareDefinition = fixtureTiprack1000ul as LabwareDefinition
  } else {
    labwareDefinition = fixture96Plate as LabwareDefinition
  }
  const legendItems = useLegendItems(selectionType)

  return (
    <div className={styles.tip_select_legend_container}>
      {legendItems.map(({ type, label }) => (
        <div key={label} className={styles.tip_select_legend_item}>
          {isTipSelection ? (
            <TipStatus
              type={type as TipType}
              labwareDefinition={labwareDefinition}
              size={size}
            />
          ) : (
            <WellStatus
              type={type as WellType}
              labwareDefinition={labwareDefinition}
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

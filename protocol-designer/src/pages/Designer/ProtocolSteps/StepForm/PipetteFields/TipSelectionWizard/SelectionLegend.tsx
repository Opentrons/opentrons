import {
  COLORS,
  StyledText,
  TipStatus,
  WellStatus,
} from '@opentrons/components'

import styles from './tipselectionwizard.module.css'
import { useLegendItems } from './useLegendItems'

import type { TipType, WellType } from '@opentrons/components'
import type { LabwareDefinition } from '@opentrons/shared-data'

interface SelectionLegendProps {
  labwareDefinition: LabwareDefinition
  size?: string
}

export function SelectionLegend({
  labwareDefinition,
  size,
}: SelectionLegendProps): JSX.Element {
  const isTipSelection = labwareDefinition.parameters.isTiprack
  const selectionType = isTipSelection ? 'tip' : 'well'
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

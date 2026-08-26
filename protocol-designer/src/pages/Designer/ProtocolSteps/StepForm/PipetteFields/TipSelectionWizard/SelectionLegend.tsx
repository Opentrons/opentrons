import {
  COLORS,
  DEFAULT_TIP_SIZE,
  LABWARE,
  StyledText,
  TipStatus,
  WellStatus,
} from '@opentrons/components'
import { fixtureTiprack1000ul } from '@opentrons/shared-data'

import styles from './tipselectionwizard.module.css'
import { useLegendItems } from './useLegendItems'

import type { ReactNode } from 'react'
import type { TipType, WellType } from '@opentrons/components'
import type { LabwareWellMap } from '@opentrons/shared-data'

interface SelectionLegendProps {
  selectionType: 'tip' | 'well'
}

export function SelectionLegend({
  selectionType,
}: SelectionLegendProps): ReactNode {
  const labwareWellMap = fixtureTiprack1000ul.wells as LabwareWellMap
  const isTipSelection = selectionType === 'tip'
  const legendItems = useLegendItems(selectionType)
  return (
    <div className={styles.tip_select_legend_container}>
      {legendItems.map(({ type, label }) => (
        <div key={label} className={styles.tip_select_legend_item}>
          {isTipSelection ? (
            <TipStatus
              type={type as TipType}
              size={DEFAULT_TIP_SIZE}
              wellMap={labwareWellMap}
              wellName={label}
            />
          ) : (
            <div className={styles.well_legend_item}>
              <WellStatus
                type={type as WellType}
                size={DEFAULT_TIP_SIZE}
                parentType={LABWARE}
                wellMap={labwareWellMap}
                wellName={label}
              />
            </div>
          )}

          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {label}
          </StyledText>
        </div>
      ))}
    </div>
  )
}

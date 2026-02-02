import { useTranslation } from 'react-i18next'

import { COLORS, StyledText, TipStatus } from '@opentrons/components'

import styles from './tipselectionwizard.module.css'

import type { TipType } from '@opentrons/components'

function useTipLegendItems(): Array<{
  label: string
  tipType: TipType
}> {
  const { t } = useTranslation('tip_selection')
  return [
    {
      label: t('legend.new_tip'),
      tipType: 'new',
    },
    {
      label: t('legend.used_tip'),
      tipType: 'used',
    },
    {
      label: t('legend.selected_tip'),
      tipType: 'selected',
    },
    {
      label: t('legend.no_tip'),
      tipType: 'no',
    },
    {
      label: t('legend.inaccessible_tip'),
      tipType: 'inaccessible',
    },
  ]
}

export function TipLegend(): JSX.Element {
  const legendItems = useTipLegendItems()
  return (
    <div className={styles.tip_select_legend_container}>
      {legendItems.map(({ tipType, label }) => (
        <div key={label} className={styles.tip_select_legend_item}>
          <TipStatus type={tipType} />
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {label}
          </StyledText>
        </div>
      ))}
    </div>
  )
}

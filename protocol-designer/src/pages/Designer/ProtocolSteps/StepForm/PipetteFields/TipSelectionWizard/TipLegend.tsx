import { useTranslation } from 'react-i18next'

import { COLORS, StyledText, Tip } from '@opentrons/components'

import styles from './tipselectionwizard.module.css'

import type { TipType } from '@opentrons/components'

function useTipLegendItems(): Array<{
  label: string
  type: TipType
}> {
  const { t } = useTranslation('tip_selection')
  return [
    {
      label: t('legend.new_tip'),
      type: 'new',
    },
    {
      label: t('legend.used_tip'),
      type: 'used',
    },
    {
      label: t('legend.selected_tip'),
      type: 'selected',
    },
    {
      label: t('legend.no_tip'),
      type: 'no',
    },
    {
      label: t('legend.inaccessible_tip'),
      type: 'inaccessible',
    },
  ]
}

export function TipLegend(): JSX.Element {
  const legendItems = useTipLegendItems()
  return (
    <div className={styles.tip_select_legend_container}>
      {legendItems.map(({ type, label }) => (
        <div key={label} className={styles.tip_select_legend_item}>
          <Tip type={type} />
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {label}
          </StyledText>
        </div>
      ))}
    </div>
  )
}

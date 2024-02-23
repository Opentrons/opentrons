import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@opentrons/components'
import styles from './WellSelectionInstructions.css'

export function WellSelectionInstructions(): JSX.Element {
  const { t } = useTranslation('well_selection')
  return (
    <div className={styles.wrapper}>
      <Icon className={styles.click_drag_icon} name="ot-click-and-drag" />
      <div className={styles.instructional_text}>
        <p>{t('select_instructions')}</p>
        <p>{t('deselect_instructions')}</p>
      </div>
    </div>
  )
}

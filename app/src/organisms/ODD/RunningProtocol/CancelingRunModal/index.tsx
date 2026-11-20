import { useTranslation } from 'react-i18next'

import { Icon, LegacyStyledText } from '@opentrons/components'

import { OddModal } from '/app/molecules/OddModal'

import styles from './cancelingmodal.module.css'

import type { ReactNode } from 'react'

export function CancelingRunModal(): ReactNode {
  const { t, i18n } = useTranslation('run_details')

  return (
    <OddModal>
      <div className={styles.container}>
        <Icon
          name="ot-spinner"
          spin
          size="3.75rem"
          className={styles.icon}
          aria-label="CancelingRunModal_icon"
        />
        <LegacyStyledText forwardedAs="h4" className={styles.canceling_text}>
          {i18n.format(t('canceling_run_dot'), 'capitalize')}
        </LegacyStyledText>
      </div>
    </OddModal>
  )
}

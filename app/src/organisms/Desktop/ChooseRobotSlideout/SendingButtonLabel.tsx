import { useTranslation } from 'react-i18next'

import { Icon } from '@opentrons/components'

import styles from './availablerobotoption.module.css'

export function SendingButtonLabel(): JSX.Element {
  const { t } = useTranslation('protocol_details')

  return (
    <span className={styles.sending_label}>
      {t('sending')}
      <Icon name="ot-spinner" spin size="1rem" data-testid="sending-spinner" />
    </span>
  )
}

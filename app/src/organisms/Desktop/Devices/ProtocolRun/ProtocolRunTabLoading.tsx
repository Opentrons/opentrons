import { useTranslation } from 'react-i18next'

import { InfoScreen } from '@opentrons/components'

import styles from './protocolruntabloading.module.css'

/** Shared spinner + copy for protocol run details tabs while run/analysis load. */
export function ProtocolRunTabLoading(): JSX.Element {
  const { t } = useTranslation('protocol_setup')

  return (
    <div className={styles.container}>
      <InfoScreen
        iconName="ot-spinner"
        content={t('run_setup_loading')}
        height="auto"
      />
    </div>
  )
}

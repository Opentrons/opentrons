import { useTranslation } from 'react-i18next'

import { InfoScreen } from '@opentrons/components'

interface ProtocolRunTabLoadingProps {
  tabName: string
}

/** Shared spinner for protocol run details tabs while tab data loads. */
export function ProtocolRunTabLoading({
  tabName,
}: ProtocolRunTabLoadingProps): JSX.Element {
  const { t } = useTranslation('run_details')

  return (
    <InfoScreen
      iconName="ot-spinner"
      content={t('tab_loading', { tab: tabName })}
      height="auto"
    />
  )
}

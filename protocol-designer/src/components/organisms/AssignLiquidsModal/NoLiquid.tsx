import { useTranslation } from 'react-i18next'

import { InfoScreen } from '@opentrons/components'

export function NoLiquid(): JSX.Element {
  const { t } = useTranslation('liquids')
  return (
    <InfoScreen
      content={t('no_liquids_added')}
      subContent={t('select_wells_to_add')}
    />
  )
}

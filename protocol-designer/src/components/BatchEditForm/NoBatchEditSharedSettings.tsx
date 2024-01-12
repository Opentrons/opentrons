import * as React from 'react'
import {
  Flex,
  Text,
  ALIGN_CENTER,
  C_DARK_GRAY,
  JUSTIFY_CENTER,
  SPACING_3,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'

export const NoBatchEditSharedSettings = (): JSX.Element => {
  const { t } = useTranslation('application')
  return (
    <Flex
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      height="75%"
      padding={SPACING_3}
    >
      <Text id="Text_noSharedSettings" color={C_DARK_GRAY}>
        {t('no_batch_edit_shared_settings')}
      </Text>
    </Flex>
  )
}

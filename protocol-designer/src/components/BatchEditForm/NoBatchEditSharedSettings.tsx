import * as React from 'react'
import {
  Flex,
  Text,
  ALIGN_CENTER,
  C_DARK_GRAY,
  JUSTIFY_CENTER,
  SPACING_3,
} from '@opentrons/components'
import { i18n } from '../../localization'

export const NoBatchEditSharedSettings = (): JSX.Element => {
  return (
    <Flex
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      height="75%"
      padding={SPACING_3}
    >
      <Text id="Text_noSharedSettings" color={C_DARK_GRAY}>
        {i18n.t('application.no_batch_edit_shared_settings')}
      </Text>
    </Flex>
  )
}

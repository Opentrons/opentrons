import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  Flex,
  DIRECTION_COLUMN,
  Text,
  DIRECTION_ROW,
  ALIGN_CENTER,
} from '@opentrons/components'

import screwInAdpater from '@opentrons/app/src/assets/images/heater_shaker_screwdriver_adapter.png'

export function AttachAdapter(): JSX.Element {
  const { t } = useTranslation('heater_shaker')

  return (
    <Flex

      color={COLORS.darkBlack}
      flexDirection={DIRECTION_COLUMN}
      fontSize="16px"
      fontWeight={700}
    >
      <Flex paddingBottom="24px">{t('adapter_title')}</Flex>
      <Flex flexDirection={DIRECTION_ROW}>
        <Text color={COLORS.darkGrey} paddingRight="17px">
          {t('adapter_num_2a')}
        </Text>
        <Flex border="1px solid #E3E3E3" width="598px">
          <Flex padding="5px 81px 16px 46px">
            <img src={screwInAdpater} />
          </Flex>
          <Flex alignItems={ALIGN_CENTER}>
            <Text fontWeight={400}>{t('adapter_attach_title')}</Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

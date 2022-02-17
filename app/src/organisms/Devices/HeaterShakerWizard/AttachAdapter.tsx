import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  COLORS,
  Flex,
  DIRECTION_COLUMN,
  Text,
  DIRECTION_ROW,
  Icon,
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
      <Flex paddingBottom="24px">{t('step_2_of_4_attach_adapter')}</Flex>
      <Flex flexDirection={DIRECTION_ROW}>
        <Text color={'#8A8C8E'} paddingRight="17px">
          {t('2a')}
        </Text>
        <Flex border="1px solid #E3E3E3">
          <Flex padding="5px 81px 16px 46px">
            <img src={screwInAdpater} />
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <Flex marginTop="18px" fontWeight={400}>
              {t('attach_adapter_to_module')}
            </Flex>
            <Flex
              marginTop="8px"
              backgroundColor="#F8F8F8"
              paddingTop="16px"
              paddingLeft="16px"
              flexDirection={DIRECTION_ROW}
              marginRight="11px"
            >
              <Flex
                size="32px"
                color={COLORS.darkGreyEnabled}
                paddingBottom="14px"
              >
                <Icon name="information" />
              </Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                paddingLeft="8px"
                fontSize="11px"
                paddingBottom="16px"
              >
                <Text fontWeight={600}>
                  {t('attach_screwdriver_and_screw')}
                </Text>
                <Text fontWeight={400}>
                  {t('attach_screwdriver_and_screw_explanation')}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

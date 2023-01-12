import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
  Icon,
  Btn,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'

export function SearchNetwork(): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  return (
    <>
      {/* <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        marginBottom="3.0625rem"
      >
        <Btn onClick={() => history.push('/network-setup')}>
          <Flex flexDirection={DIRECTION_ROW}>
            <Icon
              name="arrow-back"
              marginRight={SPACING.spacing2}
              size="1.875rem"
            />
            <StyledText
              fontSize="1.625rem"
              lineHeight="2.1875rem"
              fontWeight="700"
            >
              {t('shared:back')}
            </StyledText>
          </Flex>
        </Btn>
        <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="700">
          {t('connect_via', { type: t('wifi') })}
        </StyledText>
        <Icon name="ot-spinner" spin size="3.3125rem" />
      </Flex> */}
      <Flex
        height="26.5625rem"
        backgroundColor="#D6D6D6"
        justifyContent={JUSTIFY_CENTER}
      >
        <Flex
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          flexDirection={DIRECTION_COLUMN}
        >
          <StyledText
            fontSize="2rem"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            lineHeight="2.72375rem"
            marginTop={SPACING.spacingXXL}
          >
            {t('searching_for_networks')}
          </StyledText>
        </Flex>
      </Flex>
    </>
  )
}

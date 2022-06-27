import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  ALIGN_FLEX_START,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'

import { TertiaryButton } from '../../atoms/buttons'

interface IpHostnameFieldProps {
  field: any
  inputRef: { current: null | HTMLInputElement }
}

export function IpHostnameField({
  field,
  inputRef,
}: IpHostnameFieldProps): JSX.Element {
  const { t } = useTranslation('app_settings')

  return (
    <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_FLEX_START}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        paddingRight={SPACING.spacing3}
        marginTop={SPACING.spacing2}
      >
        <input
          id="ip"
          name="ip"
          {...field}
          type="text"
          ref={inputRef}
          height="100%"
        />
      </Flex>
      <TertiaryButton
        fontSize={TYPOGRAPHY.fontSizeH6}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        lineHeight={TYPOGRAPHY.lineHeight12}
        marginTop={SPACING.spacing2}
        width="100%"
      >
        {t('add_ip_button')}
      </TertiaryButton>
    </Flex>
  )
}

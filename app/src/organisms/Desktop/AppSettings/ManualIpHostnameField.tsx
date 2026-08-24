import { useTranslation } from 'react-i18next'

import {
  ALIGN_FLEX_START,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TertiaryButton } from '/app/atoms/buttons'

import type { ReactNode } from 'react'

interface IpHostnameFieldProps {
  field: any
  inputRef: { current: null | HTMLInputElement }
}

export function IpHostnameField({
  field,
  inputRef,
}: IpHostnameFieldProps): ReactNode {
  const { t } = useTranslation('app_settings')

  return (
    <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_FLEX_START}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        paddingRight={SPACING.spacing8}
        marginTop={SPACING.spacing4}
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
        marginTop={SPACING.spacing4}
        width="100%"
      >
        {t('add_ip_button')}
      </TertiaryButton>
    </Flex>
  )
}

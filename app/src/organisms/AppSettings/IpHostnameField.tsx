import * as React from 'react'
import {
  Flex,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { TertiaryButton } from '../../atoms/Buttons'

export interface IpHostnameFieldProps {
  field: any
  form: any
  inputRef: { current: null | HTMLInputElement }
}

export function IpHostnameField(props: IpHostnameFieldProps): JSX.Element {
  const { t } = useTranslation('app_settings')
  const {
    field,
    form: { submitForm },
    inputRef,
  } = props

  return (
    <Flex flexDirection={DIRECTION_ROW}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        paddingRight={SPACING.spacing3}
        width="100%"
      >
        <input
          {...field}
          onBlur={event => {
            field.onBlur(event)
            if (field.value) submitForm()
          }}
          type="text"
          ref={inputRef}
        />
        <TertiaryButton
          fontSize={TYPOGRAPHY.fontSizeH6}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          lineHeight={TYPOGRAPHY.lineHeight12}
          paddingX={SPACING.spacing4}
          onClick={null}
        >
          {t('add_ip_button')}
        </TertiaryButton>
      </Flex>
    </Flex>
  )
}

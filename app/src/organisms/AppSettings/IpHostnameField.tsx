import * as React from 'react'
import {
  Flex,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  ALIGN_FLEX_START,
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
    <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_FLEX_START}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        paddingRight={SPACING.spacing3}
        marginTop={SPACING.spacing2}
      >
        <input
          {...field}
          onBlur={event => {
            field.onBlur(event)
            if (field.value) submitForm()
          }}
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
        onClick={null} // call startDiscovery
        width="100%"
      >
        {t('add_ip_button')}
      </TertiaryButton>
    </Flex>
  )
}

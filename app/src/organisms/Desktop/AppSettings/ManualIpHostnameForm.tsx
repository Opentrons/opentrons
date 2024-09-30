import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import styled from 'styled-components'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SIZE_2,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TertiaryButton } from '/app/atoms/buttons'
import { addManualIp } from '/app/redux/config'
import { startDiscovery } from '/app/redux/discovery'

import type { FieldError, Resolver } from 'react-hook-form'
import type { Dispatch } from '/app/redux/types'

const FlexForm = styled.form`
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
`

const StyledInput = styled.input`
  width: 100%;
  flex: 6;
  margin: ${SPACING.spacing4} 0;
  background-color: ${COLORS.white};
  border-radius: ${SPACING.spacing4};
  border: 1px ${BORDERS.styleSolid} ${COLORS.grey30};
  height: ${SIZE_2};
  font-size: ${TYPOGRAPHY.fontSizeP};
  padding-left: ${SPACING.spacing8};

  &:active {
    border: 1px ${BORDERS.styleSolid} ${COLORS.grey50};
  }

  &:hover {
    border: 1px ${BORDERS.styleSolid} ${COLORS.blue50};
  }

  &:focus-visible {
    outline: none;
  }

  &:disabled {
    border: 1px ${BORDERS.styleSolid} ${COLORS.grey30};
  }
`

interface FormValues {
  ip: string
}
interface ManualIpHostnameFormProps {
  setMostRecentAddition: (ip: string) => void
}

export function ManualIpHostnameForm({
  setMostRecentAddition,
}: ManualIpHostnameFormProps): JSX.Element {
  const { t } = useTranslation('app_settings')
  const dispatch = useDispatch<Dispatch>()
  const addManualIpAndHostname = (ip: string): void => {
    dispatch(addManualIp(ip))
    dispatch(startDiscovery())
  }

  const resolver: Resolver<FormValues> = values => {
    let errors = {}
    errors = validateForm(values, errors)
    return { values, errors }
  }
  const { formState, handleSubmit, register, reset } = useForm<FormValues>({
    defaultValues: {
      ip: '',
    },
    resolver: resolver,
  })

  const validateForm = (
    data: FormValues,
    errors: Record<string, FieldError>
  ): Record<string, FieldError> => {
    const ip = data.ip.trim()
    let message: string | undefined
    if (!ip) {
      message = t('add_ip_error')
    }
    const updatedErrors =
      message != null
        ? {
            ...errors,
            ip: {
              type: 'error',
              message: message,
            },
          }
        : errors
    return updatedErrors
  }

  const onSubmit = (data: FormValues): void => {
    const trimmedIp = data.ip.trim()
    const inputForm = document.getElementById('ip')

    if (inputForm !== null) {
      inputForm.style.border = `1px solid ${COLORS.grey30}`
    }

    addManualIpAndHostname(trimmedIp)
    reset()
    setMostRecentAddition(trimmedIp)
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      margin={`${SPACING.spacing4} 0`}
      height={SPACING.spacing32}
    >
      <FlexForm onSubmit={handleSubmit(onSubmit)}>
        <StyledInput
          id="ip"
          type="text"
          {...register('ip')}
          data-testid="manual-ip-hostname-input"
        />
        <TertiaryButton
          fontSize={TYPOGRAPHY.fontSizeH6}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          lineHeight={TYPOGRAPHY.lineHeight12}
          marginLeft={SPACING.spacing8}
          type="submit"
        >
          {t('add_ip_button')}
        </TertiaryButton>
      </FlexForm>
      {formState.errors?.ip != null && (
        <LegacyStyledText
          as="label"
          marginTop={SPACING.spacing4}
          color={COLORS.red50}
        >
          {formState.errors.ip.message}
        </LegacyStyledText>
      )}
    </Flex>
  )
}

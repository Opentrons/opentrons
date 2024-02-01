import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import styled from 'styled-components'

import {
  Flex,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  COLORS,
  SIZE_2,
  BORDERS,
} from '@opentrons/components'

import { TertiaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { addManualIp } from '../../redux/config'
import { startDiscovery } from '../../redux/discovery'

import type { Dispatch } from '../../redux/types'

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

interface FormErrors {
  ip?: {
    type: string
    message: string
  }
}
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

  const validateForm = (data: FormValues): any => {
    const errors: FormErrors = {}
    const ip = data.ip.trim()
    // ToDo: kj 12/19/2022 for this, the best way is to use the regex because invisible unicode characters
    if (!ip) {
      errors.ip = { type: 'required', message: t('add_ip_error') }
    }
    return errors
  }

  const { formState, handleSubmit, register, reset } = useForm<FormValues>({
    defaultValues: {
      ip: '',
    },
    resolver: data => {
      return validateForm(data)
    },
  })

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
        <StyledText
          as="label"
          marginTop={SPACING.spacing4}
          color={COLORS.red50}
        >
          {formState.errors.ip}
        </StyledText>
      )}
    </Flex>
  )
}

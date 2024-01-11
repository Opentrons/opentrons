import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useFormik } from 'formik'
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
  border: 1px ${BORDERS.styleSolid} ${COLORS.grey35};
  height: ${SIZE_2};
  font-size: ${TYPOGRAPHY.fontSizeP};

  &:active {
    border: 1px ${BORDERS.styleSolid} ${COLORS.grey50Enabled};
  }

  &:hover {
    border: 1px ${BORDERS.styleSolid} ${COLORS.blue50};
  }

  &:focus-visible {
    outline: none;
  }

  &:disabled {
    border: 1px ${BORDERS.styleSolid} ${COLORS.grey50Disabled};
  }
`

interface FormikErrors {
  ip?: string
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
  const formik = useFormik({
    initialValues: {
      ip: '',
    },
    onSubmit: (values, { resetForm }) => {
      const ip = values.ip.trim()
      const inputForm = document.getElementById('ip')
      if (inputForm != null)
        inputForm.style.border = `1px solid ${String(COLORS.grey35)}`
      addManualIpAndHostname(ip)
      resetForm()
      setMostRecentAddition(ip)
    },
    validate: values => {
      const errors: FormikErrors = {}
      const ip = values.ip.trim()
      // ToDo: kj 12/19/2022 for this, the best way is to use the regex because invisible unicode characters
      if (!ip) {
        errors.ip = t('add_ip_error')
        const inputForm = document.getElementById('ip')
        if (inputForm != null)
          inputForm.style.border = `1px solid ${String(COLORS.errorEnabled)}`
      }
      return errors
    },
  })

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      margin={`${SPACING.spacing4} 0`}
      height={SPACING.spacing32}
    >
      <FlexForm onSubmit={formik.handleSubmit}>
        <StyledInput
          id="ip"
          name="ip"
          type="text"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.ip}
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
      {formik.errors.ip != null && (
        <StyledText
          as="label"
          marginTop={SPACING.spacing4}
          color={COLORS.errorEnabled}
        >
          {formik.errors.ip}
        </StyledText>
      )}
    </Flex>
  )
}

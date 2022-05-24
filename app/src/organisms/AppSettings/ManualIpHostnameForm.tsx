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
  Text,
  COLORS,
} from '@opentrons/components'

import { TertiaryButton } from '../../atoms/buttons'
import { addManualIp } from '../../redux/config'
import { startDiscovery } from '../../redux/discovery'

import type { Dispatch } from '../../redux/types'

interface FormikErrors {
  ip?: string
}

interface ManualIpHostnameFormProps {
  setMostRecentAddition: (ip: string) => void
}

const FlexForm = styled.form`
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
`

const StyledInput = styled.input`
  height: ${SPACING.spacing5};
  width: 100%;
  flex: 6;
  margin: ${SPACING.spacing2} 0;
  border: 1px solid ${COLORS.medGrey};
`

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
      if (inputForm) inputForm.style.border = `1px solid ${COLORS.medGrey}`
      addManualIpAndHostname(ip)
      setMostRecentAddition(ip)
      resetForm({ values: undefined })
    },
    validate: values => {
      const errors: FormikErrors = {}
      const ip = values.ip.trim()
      if (!ip) {
        errors.ip = t('add_ip_error')
        const inputForm = document.getElementById('ip')
        if (inputForm) inputForm.style.border = `1px solid ${COLORS.error}`
      }
      return errors
    },
  })

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      margin={`${SPACING.spacing2} 0`}
      height={SPACING.spacing6}
    >
      <FlexForm onSubmit={formik.handleSubmit}>
        <StyledInput
          id="ip"
          name="ip"
          type="text"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.ip}
        />
        <TertiaryButton
          fontSize={TYPOGRAPHY.fontSizeH6}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          lineHeight={TYPOGRAPHY.lineHeight12}
          marginLeft={SPACING.spacing3}
          padding={`6px 12px}`}
          type="submit"
        >
          {t('add_ip_button')}
        </TertiaryButton>
      </FlexForm>
      {formik.errors.ip && (
        <Text
          marginTop={SPACING.spacing2}
          fontSize={TYPOGRAPHY.fontSizeH6}
          lineHeight={TYPOGRAPHY.lineHeight12}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          fontStyle={TYPOGRAPHY.fontStyleNormal}
          color={COLORS.error}
        >
          {formik.errors.ip}
        </Text>
      )}
    </Flex>
  )
}

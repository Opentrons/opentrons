import React from 'react'
import { connect } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useFormik } from 'formik'
import styled from 'styled-components'
import {
  Flex,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  WRAP,
  TYPOGRAPHY,
  SPACING,
  Text,
  COLORS,
} from '@opentrons/components'
import { TertiaryButton } from '../../atoms/Buttons'
import { getConfig, addManualIp } from '../../redux/config'
import { startDiscovery } from '../../redux/discovery'

import type { MapDispatchToProps } from 'react-redux'
import type { State } from '../../redux/types'
import type { DiscoveryCandidates } from '../../redux/config/types'

interface SP {
  candidates: DiscoveryCandidates
}

interface DP {
  addManualIp: (ip: string) => unknown
  checkManualIp: () => unknown
}

interface FormikErrors {
  ip?: string
}

type Props = SP &
  DP & {
    setMostRecentAddition: (ip: string) => void
  }

const Form = styled.form`
  display: inline-block;
  height: 100%;
`
export function ManualIpHostnameFormComponent(props: Props): JSX.Element {
  const { t } = useTranslation('app_settings')
  const formik = useFormik({
    initialValues: {
      ip: '',
    },
    onSubmit: (values, { resetForm }) => {
      console.log('values', values)
      // setShowSpinner(true)
      const ip = values.ip.trim()
      const inputForm = document.getElementById('ip')
      if (inputForm) inputForm.style.border = `1px solid ${COLORS.medGrey}`
      props.addManualIp(ip)
      props.setMostRecentAddition(ip)
      resetForm({ values: undefined })
      // setShowSpinner(false)
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
      flexWrap={WRAP}
      margin={`${SPACING.spacing2} 0`}
      height={SPACING.spacing6}
    >
      <Flex flexDirection={DIRECTION_ROW}>
        <Form onSubmit={formik.handleSubmit}>
          <input
            id="ip"
            name="ip"
            type="text"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.ip}
            height={SPACING.spacing5}
            width="100%"
            style={{
              flex: 2,
              margin: `${SPACING.spacing2} 0`,
              border: `1px solid ${COLORS.medGrey}`,
            }}
          />
          <TertiaryButton
            fontSize={TYPOGRAPHY.fontSizeH6}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            lineHeight={TYPOGRAPHY.lineHeight12}
            // marginTop={SPACING.spacing2}
            // margin={`${SPCING.spacingSM} 0`}
            // width="75%"
            // padding={`6px 12px}`}
            style={{ flex: 1 }}
            type="submit"
          >
            {t('add_ip_button')}
          </TertiaryButton>
        </Form>
      </Flex>
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

function mapStateToProps(state: State): SP {
  return {
    candidates: getConfig(state)?.discovery.candidates ?? [],
  }
}

const mapDispatchToProps: MapDispatchToProps<DP, {}> = dispatch => {
  return {
    addManualIp: ip => {
      dispatch(addManualIp(ip))
      dispatch(startDiscovery())
    },
    checkManualIp: () => {
      dispatch(startDiscovery())
    },
  }
}

export const ManualIpHostnameForm = connect(
  mapStateToProps,
  mapDispatchToProps
)(ManualIpHostnameFormComponent)

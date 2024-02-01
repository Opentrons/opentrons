import * as React from 'react'
import { Form } from 'formik'
import styled, { css } from 'styled-components'

import { FONT_SIZE_BODY_1, BUTTON_TYPE_SUBMIT } from '@opentrons/components'
import { ScrollableAlertModal } from '../../../../../molecules/modals'
import { TextField } from './TextField'
import { KeyFileField } from './KeyFileField'
import { SecurityField } from './SecurityField'
import { FIELD_TYPE_KEY_FILE, FIELD_TYPE_SECURITY } from '../constants'
import * as Copy from '../i18n'

import type { ConnectFormField, WifiNetwork } from '../types'

const fieldStyle = css`
  min-width: 12rem;
`
const StyledCopy = styled.p`
  margin: 0 1rem 1rem;
`

const StyledForm = styled(Form)`
  font-size: ${FONT_SIZE_BODY_1};
  display: table;
  width: 80%;
  margin-top: 0.5rem;
`

const StyledTextField = styled(TextField)`
  ${fieldStyle}
`

const StyledKeyFileField = styled(KeyFileField)`
  ${fieldStyle}
`

const StyledSecurityField = styled(SecurityField)`
  ${fieldStyle}
`

export interface FormModalProps {
  id: string
  network: WifiNetwork | null
  fields: ConnectFormField[]
  isValid: boolean
  onCancel: () => unknown
}

export const FormModal = (props: FormModalProps): JSX.Element => {
  const { id, network, fields, isValid, onCancel } = props

  const heading =
    network !== null
      ? Copy.CONNECT_TO_SSID(network.ssid)
      : Copy.FIND_AND_JOIN_A_NETWORK

  const body =
    network !== null
      ? Copy.NETWORK_REQUIRES_SECURITY(network)
      : Copy.ENTER_NAME_AND_SECURITY_TYPE

  return (
    <ScrollableAlertModal
      alertOverlay
      heading={heading}
      iconName="wifi"
      onCloseClick={onCancel}
      buttons={[
        { children: Copy.CANCEL, onClick: props.onCancel },
        {
          children: Copy.CONNECT,
          type: BUTTON_TYPE_SUBMIT,
          form: id,
          disabled: !isValid,
        },
      ]}
    >
      <StyledCopy>{body}</StyledCopy>
      <StyledForm id={id} placeholder="">
        {fields.map(fieldProps => {
          const { name } = fieldProps
          const fieldId = `${id}__${name}`

          if (fieldProps.type === FIELD_TYPE_SECURITY) {
            return (
              <StyledSecurityField key={name} id={fieldId} {...fieldProps} />
            )
          }

          if (fieldProps.type === FIELD_TYPE_KEY_FILE) {
            return (
              <StyledKeyFileField key={name} id={fieldId} {...fieldProps} />
            )
          }

          return <StyledTextField key={name} id={fieldId} {...fieldProps} />
        })}
      </StyledForm>
    </ScrollableAlertModal>
  )
}

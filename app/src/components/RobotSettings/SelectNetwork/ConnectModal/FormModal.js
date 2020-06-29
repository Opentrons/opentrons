// @flow
import { BUTTON_TYPE_SUBMIT, FONT_SIZE_BODY_1 } from '@opentrons/components'
import type { HTMLFormAttributes } from 'formik'
import { Form } from 'formik'
import * as React from 'react'
import type { StyledComponent } from 'styled-components'
import styled, { css } from 'styled-components'

import { ScrollableAlertModal } from '../../../modals'
import { FIELD_TYPE_KEY_FILE, FIELD_TYPE_SECURITY } from '../constants'
import * as Copy from '../i18n'
import type { ConnectFormField, WifiNetwork } from '../types'
import type { KeyFileFieldProps } from './KeyFileField'
import { KeyFileField } from './KeyFileField'
import type { SecurityFieldProps } from './SecurityField'
import { SecurityField } from './SecurityField'
import type { TextFieldProps } from './TextField'
import { TextField } from './TextField'

const fieldStyle = css`
  min-width: 12rem;
`
const StyledCopy = styled.p`
  margin: 0 1rem 1rem;
`

const StyledForm: StyledComponent<
  HTMLFormAttributes,
  {||},
  typeof Form
> = styled(Form)`
  font-size: ${FONT_SIZE_BODY_1};
  display: table;
  width: 80%;
  margin-top: 0.5rem;
`

const StyledTextField: StyledComponent<
  TextFieldProps,
  {||},
  typeof TextField
> = styled(TextField)`
  ${fieldStyle}
`

const StyledKeyFileField: StyledComponent<
  KeyFileFieldProps,
  {||},
  typeof KeyFileField
> = styled(KeyFileField)`
  ${fieldStyle}
`

const StyledSecurityField: StyledComponent<
  SecurityFieldProps,
  {||},
  typeof SecurityField
> = styled(SecurityField)`
  ${fieldStyle}
`

export type FormModalProps = {|
  id: string,
  network: WifiNetwork | null,
  fields: Array<ConnectFormField>,
  isValid: boolean,
  onCancel: () => mixed,
|}

export const FormModal = (props: FormModalProps): React.Node => {
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
      <StyledForm id={id}>
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

// @flow
import * as React from 'react'
import { Form } from 'formik'
import styled, { css } from 'styled-components'

import { FS_BODY_1, BUTTON_TYPE_SUBMIT } from '@opentrons/components'
import { ScrollableAlertModal } from '../../../modals'
import { StringField } from './StringField'
import { SelectKey } from './SelectKey'
import { SelectSecurity } from './SelectSecurity'
import * as Copy from '../i18n'

import {
  AUTH_TYPE_PASSWORD,
  AUTH_TYPE_FILE,
  AUTH_TYPE_SECURITY,
} from '../constants'

import type { HTMLFormAttributes } from 'formik'
import type { StyledComponent } from 'styled-components'
import type {
  ConnectFormField,
  WifiNetwork,
  WifiKey,
  EapOption,
} from '../types'
import type { StringFieldProps } from './StringField'
import type { SelectKeyProps } from './SelectKey'
import type { SelectSecurityProps } from './SelectSecurity'

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
  ${FS_BODY_1}
  display: table;
  width: 80%;
  margin-top: 0.5rem;
`

const StyledStringField: StyledComponent<
  StringFieldProps,
  {||},
  typeof StringField
> = styled(StringField)`
  ${fieldStyle}
`

const StyledSelectKey: StyledComponent<
  SelectKeyProps,
  {||},
  typeof SelectKey
> = styled(SelectKey)`
  ${fieldStyle}
`

const StyledSelectSecurity: StyledComponent<
  SelectSecurityProps,
  {||},
  typeof SelectSecurity
> = styled(SelectSecurity)`
  ${fieldStyle}
`

export type ConnectFormModalProps = {|
  robotName: string,
  network: WifiNetwork | null,
  fields: Array<ConnectFormField>,
  isValid: boolean,
  wifiKeys: Array<WifiKey>,
  eapOptions: Array<EapOption>,
  onCancel: () => mixed,
|}

export const ConnectFormModal = (props: ConnectFormModalProps) => {
  const {
    robotName,
    network,
    fields,
    wifiKeys,
    eapOptions,
    isValid,
    onCancel,
  } = props

  const formId = `${robotName}__ConnectModal`

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
          form: formId,
          disabled: !isValid,
        },
      ]}
    >
      <StyledCopy>{body}</StyledCopy>
      <StyledForm id={formId}>
        {fields.map(({ type, name, required, label }) => {
          const fieldProps = {
            name,
            id: `${formId}__${name}`,
            label: `${required ? '* ' : ''}${label}`,
          }

          if (type === AUTH_TYPE_SECURITY) {
            return (
              <StyledSelectSecurity
                key={name}
                {...{
                  ...fieldProps,
                  eapOptions,
                  showAllOptions: network === null,
                  placeholder: Copy.SELECT_AUTHENTICATION_METHOD,
                }}
              />
            )
          }

          if (type === AUTH_TYPE_FILE) {
            return (
              <StyledSelectKey
                key={name}
                {...{
                  ...fieldProps,
                  robotName,
                  wifiKeys,
                  placeholder: Copy.SELECT_FILE,
                }}
              />
            )
          }

          return (
            <StyledStringField
              key={name}
              {...{
                ...fieldProps,
                isPassword: type === AUTH_TYPE_PASSWORD,
              }}
            />
          )
        })}
      </StyledForm>
    </ScrollableAlertModal>
  )
}

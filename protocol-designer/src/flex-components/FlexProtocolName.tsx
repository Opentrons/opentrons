/* eslint-disable react/prop-types */
import * as React from 'react'

import { FormGroup, InputField } from '@opentrons/components'

import styles from './FlexComponents.css'
import { i18n } from '../localization'

function FlexProtocolNameComponent(formProps: any): JSX.Element {
  const { formProps: props } = formProps

  return (
    <>
      {i18n.t('flex.name_and_description.header')}

      <FormGroup className={styles.form_group}>
        <label>Protocol Name</label>
        <InputField
          autoFocus
          tabIndex={1}
          type="text"
          onChange={props.handleChange}
          onBlur={props.handleBlur}
          value={props.values.fields.pndName}
          name="fields.pndName"
        />
      </FormGroup>
      {/* <small>supporting text about any error handling goes here.</small> */}

      <FormGroup className={styles.form_group}>
        <label>Organization/Author</label>
        <InputField
          tabIndex={2}
          type="text"
          onChange={props.handleChange}
          onBlur={props.handleBlur}
          value={props.values.fields.pndOrgAuthor}
          name="fields.pndOrgAuthor"
        />
      </FormGroup>
      {/* <small>supporting text about any error handling goes here.</small> */}

      <FormGroup className={styles.form_group}>
        <label>Description</label>
        <textarea
          tabIndex={3}
          className={styles.textarea_input}
          rows={4}
          onChange={props.handleChange}
          onBlur={props.handleBlur}
          value={props.values.fields.pndDescription}
          name="fields.pndDescription"
        />
      </FormGroup>
      {/* <small>supporting text about any error handling goes here.</small> */}
    </>
  )
}

export const FlexProtocolName = FlexProtocolNameComponent

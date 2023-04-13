import * as React from 'react'
import { FormGroup, InputField } from '@opentrons/components'

function FlexProtocolNameComponent(formProps: any): JSX.Element {
  const { formProps: props } = formProps

  return (
    <>
      <FormGroup label="Protocol Name">
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
      <small>supporting text about any error handling goes here.</small>

      <FormGroup label="Organization/Author">
        <InputField
          type="text"
          onChange={props.handleChange}
          onBlur={props.handleBlur}
          value={props.values.fields.pndOrgAuthor}
          name="fields.pndOrgAuthor"
        />
      </FormGroup>
      <small>supporting text about any error handling goes here.</small>

      <FormGroup label="Description">
        <textarea
          rows={4}
          cols={195}
          onChange={props.handleChange}
          onBlur={props.handleBlur}
          value={props.values.fields.pndDescription}
          name="fields.pndDescription"
        />
      </FormGroup>
      <small>supporting text about any error handling goes here.</small>
    </>
  )
}

export const FlexProtocolName = FlexProtocolNameComponent

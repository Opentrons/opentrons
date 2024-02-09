import * as React from 'react'
import validator from '@rjsf/validator-ajv8';
import Form from '@rjsf/core'
import commandSchemaV8 from '@opentrons/shared-data/command/schemas/8.json'

const sanitized = {
  ...commandSchemaV8,
  definitions: Object.entries(commandSchemaV8.definitions).reduce((acc, [key, value]) => {
    if (key.endsWith('Create')) {
      return {
        ...acc,
        [key]: {
          ...value,
          properties: {
            params: value.properties.params 
          }
        }
      }
    } else {
      return { ...acc, [key]: value }
    }
  }, {})
}
console.log(sanitized)
function ProtocolEditorComponent(): JSX.Element {
  return (
    <div id="protocol-editor">
      <Form
        schema={sanitized}
        validator={validator}
        onChange={() => { console.log('changed') }}
        onSubmit={() => { console.log('submitted') }}
        onError={() => { console.log('errors') }}
      />
    </div>
  )
}

export const ProtocolEditor = ProtocolEditorComponent

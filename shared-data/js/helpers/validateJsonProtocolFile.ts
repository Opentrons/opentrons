import Ajv from 'ajv'
import labwareV2Schema from '../../labware/schemas/2.json'
import type { JsonProtocolFile } from '../../protocol'
import protocolSchemaV1 from '../../protocol/schemas/1.json'
import protocolSchemaV2 from '../../protocol/schemas/2.json'
import protocolSchemaV3 from '../../protocol/schemas/3.json'
import protocolSchemaV4 from '../../protocol/schemas/4.json'
import protocolSchemaV5 from '../../protocol/schemas/5.json'

import type { ValidateFunction } from 'ajv'
import { parse } from 'semver'

type ProtocolSchema =
  | typeof protocolSchemaV1
  | typeof protocolSchemaV2
  | typeof protocolSchemaV3
  | typeof protocolSchemaV4
  | typeof protocolSchemaV5

const SCHEMA_BY_VERSION: { [version: string]: ProtocolSchema } = {
  '1': protocolSchemaV1,
  '2': protocolSchemaV2,
  '3': protocolSchemaV3,
  '4': protocolSchemaV4,
  '5': protocolSchemaV5,
}

const ajv = new Ajv({ allErrors: true, jsonPointers: true })
// protocol schema contains reference to v2 labware schema, so give AJV access to it
ajv.addSchema(labwareV2Schema)

type protcolValidationErrorKey = 'INVALID_FILE_TYPE' | 'INVALID_JSON_FILE'

interface ValidateJsonProtocolFileOptions {
  handleSuccess?: (parsedProtocol: JsonProtocolFile) => unknown
  handleError?: (
    errorKey: protcolValidationErrorKey,
    validationErrors?: ValidateFunction['errors']
  ) => unknown
}
export function validateJsonProtocolFile(
  file: File,
  options: ValidateJsonProtocolFileOptions = {}
): Promise<JsonProtocolFile> {
  const reader = new FileReader()
  const { handleError = _ek => {}, handleSuccess = _pP => {} } = options

  if (!file.name.endsWith('.json')) {
    handleError('INVALID_FILE_TYPE')
    return new Promise((_resolve, reject) => reject())
  } else {
    return new Promise((resolve, reject) => {
      reader.onload = readEvent => {
        const result =
          'currentTarget' in readEvent &&
          readEvent.target != null &&
          'result' in readEvent.target
            ? readEvent.target.result ?? null
            : null
        let parsedProtocol: JsonProtocolFile

        try {
          if (typeof result !== 'string') {
            handleError('INVALID_FILE_TYPE')
            reject()
          } else {
            parsedProtocol = JSON.parse(result) as any
            let validateAgainstSchema
            if ('protocol-schema' in parsedProtocol) {
              // 'protocol-schema' key only present in V1
              validateAgainstSchema = ajv.compile(protocolSchemaV1)
            } else {
              const { schemaVersion } = parsedProtocol
              validateAgainstSchema = ajv.compile(
                SCHEMA_BY_VERSION[String(schemaVersion)]
              )
            }

            const isValidProtocol = validateAgainstSchema(parsedProtocol)
            if (!isValidProtocol) {
              handleError('INVALID_JSON_FILE', validateAgainstSchema.errors)
              reject()
            }

            handleSuccess(parsedProtocol)
            resolve(parsedProtocol)
          }
        } catch (error) {
          handleError('INVALID_JSON_FILE', error)
          reject()
        }
      }
      reader.readAsText(file)
    })
  }
}

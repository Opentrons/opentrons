import { describe, expect, it } from 'vitest'

import { deserializeExpectedMessages } from '../deserialize'

import type { NotifyResponseData } from '@opentrons/app/src/redux/shell/types'

const MOCK_VALID_RESPONSE: NotifyResponseData = { refetch: true }
const MOCK_VALID_STRING_RESPONSE = JSON.stringify(MOCK_VALID_RESPONSE)
const MOCK_INVALID_OBJECT = JSON.stringify({ test: 'MOCK_RESPONSE' })
const MOCK_INVALID_STRING = 'MOCK_STRING'

describe('closeConnectionsForcefullyFor', () => {
  it('should resolve with the deserialized message if it is a valid notify response', async () => {
    const response = await deserializeExpectedMessages(
      MOCK_VALID_STRING_RESPONSE
    )
    expect(response).toEqual(MOCK_VALID_RESPONSE)
  })

  it('should reject with an error if the deserialized message is not a valid notify response', async () => {
    const responsePromise = deserializeExpectedMessages(MOCK_INVALID_OBJECT)
    await expect(responsePromise).rejects.toThrowError(
      'Unexpected data received from notify broker: {"test":"MOCK_RESPONSE"}'
    )
  })

  it('should reject with an error if the message cannot be deserialized', async () => {
    const responsePromise = deserializeExpectedMessages(MOCK_INVALID_STRING)
    await expect(responsePromise).rejects.toThrowError(
      'Unexpected data received from notify broker: MOCK_STRING'
    )
  })
})

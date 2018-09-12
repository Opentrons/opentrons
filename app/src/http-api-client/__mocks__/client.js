// mock http api client
'use strict'

const {
  mockResolvedValueOnce,
  mockRejectedValueOnce,
} = require('../../../__util__/mock-promise')

const client = module.exports = jest.fn()

client.__setMockResponse = function setMockResponse (...responses) {
  client.mockReset()
  responses.forEach((r) => mockResolvedValueOnce(client, r))
}

client.__setMockError = function setMockError (...errors) {
  client.mockReset()
  errors.forEach((e) => mockRejectedValueOnce(client, e))
}

client.__clearMock = function clearMockResponses () {
  client.mockReset()
}

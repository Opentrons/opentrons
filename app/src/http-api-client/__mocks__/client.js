// mock http api client
'use strict'

let _mockResponse = null
let _mockError = null

const client = module.exports = jest.fn(() => {
  if (_mockResponse) {
    return new Promise((resolve) => process.nextTick(() => {
      resolve(_mockResponse)
    }))
  }

  return new Promise((resolve, reject) => process.nextTick(() => {
    reject(_mockError || new Error('Mock values not seeded'))
  }))
})

client.__setMockResponse = function setMockResponse (response) {
  _mockError = null
  _mockResponse = response
}

client.__setMockError = function setMockError (error) {
  _mockResponse = null
  _mockError = error
}

client.__clearMock = function clearMockResponses () {
  client.mockClear()
}

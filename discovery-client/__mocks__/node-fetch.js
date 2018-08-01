// mock fetch
'use strict'

const _mockFetch = jest.fn()
let _mockResponse
let _mockError

module.exports = _mockFetch
module.exports.__setMockResponse = __setMockResponse
module.exports.__setMockError = __setMockError
module.exports.__mockReset = __mockReset

__mockReset()

function __setMockResponse (value) {
  _mockResponse = value
  _mockError = null
}

function __setMockError (error) {
  _mockResponse = null
  _mockError = error
}

function __mockReset () {
  _mockResponse = null
  _mockError = null
  _mockFetch.mockReset()
  _mockFetch.mockImplementation(url => {
    if (_mockError) return Promise.reject(_mockError)
    return Promise.resolve(_mockResponse)
  })
}

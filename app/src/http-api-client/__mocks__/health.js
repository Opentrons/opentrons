// mock health module
'use strict'

const {mockResolvedValue} = require('../../../__util__/mock-promise')
const health = module.exports = jest.genMockFromModule('../health')

health.__mockThunk = jest.fn()
health.__setResponse = action => mockResolvedValue(health.__mockThunk, action)
health.fetchHealth = jest.fn(() => health.__mockThunk)
health.healthReducer.mockReturnValue({})

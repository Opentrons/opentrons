// mock health module
'use strict'

const health = module.exports = jest.genMockFromModule('../health')

health.__mockThunk = jest.fn()
health.fetchHealth = jest.fn(() => health.__mockThunk)

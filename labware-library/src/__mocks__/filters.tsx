'use strict'

jest.mock('../definitions')

const filters = jest.genMockFromModule('../filters')

// commonjs export to mock named exports
module.exports = filters

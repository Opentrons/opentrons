'use strict'
import { vi } from 'vitest'
import * as filters from '../filters'

vi.mock('../definitions')

vi.mock('../filters')

// commonjs export to mock named exports
module.exports = filters

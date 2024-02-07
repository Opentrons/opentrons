import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { vi, afterEach } from 'vitest'

vi.mock('protocol-designer/src/labware-defs/utils')

process.env.OT_PD_VERSION = 'fake_PD_version'

afterEach(() => {
  cleanup()
})
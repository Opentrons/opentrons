import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { vi, afterEach } from 'vitest'

vi.mock('protocol-designer/src/labware-defs/utils')
vi.mock('electron-store')
vi.mock('electron-updater')
vi.mock('electron')
vi.mock('./app/src/redux/shell/remote')

process.env.OT_PD_VERSION = 'fake_PD_version'
global._PKG_VERSION_ = 'test environment'

afterEach(() => {
  cleanup()
})

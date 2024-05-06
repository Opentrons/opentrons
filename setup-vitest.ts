import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { vi, afterEach } from 'vitest'

vi.mock('protocol-designer/src/labware-defs/utils')
vi.mock('electron-store')
vi.mock('electron-updater')
vi.mock('electron')
<<<<<<< HEAD
<<<<<<< HEAD
vi.mock('./app/src/redux/shell/remote')
<<<<<<< HEAD
vi.mock('./app/src/resources/useNotifyService')
=======
vi.mock('./app/src/redux/shell/remote')
>>>>>>> e50afb44e6 (test fixes)
=======
vi.mock('./app/src/resources/useNotifyService', async () => {
  const actual = await vi.importActual('./app/src/resources/useNotifyService')
  return {
    ...actual,
    useNotifyService: () => ({
      notifyOnSettled: vi.fn(),
      isNotifyEnabled: true,
    }),
  }
})
>>>>>>> 123b2a5632 (refactor(app): refine useNotifyService (#15093))

process.env.OT_PD_VERSION = 'fake_PD_version'
global._PKG_VERSION_ = 'test environment'
global._OPENTRONS_PROJECT_ = 'robotics'
global._PKG_PRODUCT_NAME_ = 'test product'
global._PKG_BUGS_URL_ = 'http://bugs.contoso.com'
=======

process.env.OT_PD_VERSION = 'fake_PD_version'
global._PKG_VERSION_ = 'test environment'
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))

afterEach(() => {
  cleanup()
})

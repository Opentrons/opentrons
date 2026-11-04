import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

vi.mock('protocol-designer/src/labware-defs/utils')
vi.mock('electron-store')
vi.mock('electron-updater')
vi.mock('electron')
vi.mock('./app/src/redux/shell/remote')
vi.mock('./app/src/resources/useNotifyDataReady', async () => {
  const actual = await vi.importActual('./app/src/resources/useNotifyDataReady')
  return {
    ...actual,
    useNotifyDataReady: () => ({
      notifyOnSettled: vi.fn(),
      isNotifyEnabled: true,
    }),
  }
})

global._OT_PD_VERSION_ = 'fake_PD_version'
global._OT_PD_REQUIRED_APP_VERSION_ = 'fake_app_version'
global._PKG_VERSION_ = 'test environment'
global._OPENTRONS_PROJECT_ = 'robotics'
global._PKG_PRODUCT_NAME_ = 'test product'
global._PKG_BUGS_URL_ = 'http://bugs.contoso.com'
global._OT_PD_LATEST_LABWARE_VERSIONS_ = {}

afterEach(() => {
  cleanup()
})

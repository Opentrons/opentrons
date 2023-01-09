import {
  OT2_MANIFEST_URL,
  OT3_MANIFEST_URL,
} from '@opentrons/app/src/redux/config'
import type { ConfigV12 } from '@opentrons/app/src/redux/config/types'

export const MOCK_CONFIG_V12: ConfigV12 = {
  version: 12,
  devtools: false,
  reinstallDevtools: false,
  update: { channel: _PKG_VERSION_.includes('beta') ? 'beta' : 'latest' },
  log: { level: { file: 'debug', console: 'info' } },
  ui: {
    width: 1024,
    height: 600,
    url: { protocol: 'file:', path: 'ui/index.html' },
    webPreferences: { webSecurity: true },
    minWidth: 600,
  },
  analytics: {
    appId: 'mock_id',
    optedIn: false,
    seenOptIn: true,
  },
  support: {
    userId: 'mock-intercom-id',
    createdAt: 1589744281,
    name: 'Unknown User',
    email: null,
  },
  discovery: {
    candidates: [],
    disableCache: false,
  },
  labware: {
    directory: '/Users/ot/Library/Application Support/Opentrons/labware',
    showLabwareOffsetCodeSnippets: false,
  },
  alerts: { ignored: [] },
  p10WarningSeen: {},
  calibration: { useTrashSurfaceForTipCal: null },
  python: { pathToPythonOverride: null },
  modules: { heaterShaker: { isAttached: false } },
  isOnDevice: false,
  protocols: { sendAllProtocolsToOT3: false, protocolsStoredSortKey: null },
  robotSystemUpdate: {
    manifestUrls: {
      OT2: OT2_MANIFEST_URL,
      OT3: OT3_MANIFEST_URL,
    },
  },
}

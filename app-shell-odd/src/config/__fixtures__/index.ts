import type {
  ConfigV12,
  ConfigV13,
  ConfigV14,
  ConfigV15,
  ConfigV16,
  ConfigV17,
  ConfigV18,
} from '@opentrons/app/src/redux/config/types'

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
  isOnDevice: true,
  protocols: { sendAllProtocolsToOT3: false, protocolsStoredSortKey: null },
  robotSystemUpdate: {
    manifestUrls: {
      OT2: 'fake-ot2',
      OT3: 'fake-ot3',
    },
  },
}

export const MOCK_CONFIG_V13: ConfigV13 = {
  ...MOCK_CONFIG_V12,
  version: 13,
  protocols: {
    ...MOCK_CONFIG_V12.protocols,
    protocolsOnDeviceSortKey: null,
  },
}

export const MOCK_CONFIG_V14: ConfigV14 = {
  ...MOCK_CONFIG_V13,
  version: 14,
  protocols: {
    ...MOCK_CONFIG_V13.protocols,
    pinnedProtocolIds: [],
  },
}

export const MOCK_CONFIG_V15: ConfigV15 = {
  ...MOCK_CONFIG_V14,
  version: 15,
  onDeviceDisplaySettings: {
    sleepMs: 60 * 1000 * 60 * 24 * 7,
    brightness: 4,
    textSize: 1,
  },
}

export const MOCK_CONFIG_V16: ConfigV16 = {
  ...MOCK_CONFIG_V15,
  version: 16,
  onDeviceDisplaySettings: {
    ...MOCK_CONFIG_V15.onDeviceDisplaySettings,
    unfinishedUnboxingFlowRoute: '/welcome',
  },
}

export const MOCK_CONFIG_V17: ConfigV17 = {
  ...MOCK_CONFIG_V16,
  version: 17,
  protocols: {
    ...MOCK_CONFIG_V16.protocols,
    applyHistoricOffsets: true,
  },
}

export const MOCK_CONFIG_V18: ConfigV18 = {
  ...(() => {
    const { robotSystemUpdate, version, ...rest } = MOCK_CONFIG_V17
    return rest
  })(),
  version: 18,
}

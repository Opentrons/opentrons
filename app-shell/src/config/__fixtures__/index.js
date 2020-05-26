// @flow

import type { ConfigV0, ConfigV1 } from '@opentrons/app/src/config/types'

export const MOCK_CONFIG_V0: ConfigV0 = {
  version: 0, // Default key added on boot if missing in configs
  devtools: false,
  reinstallDevtools: false,
  update: {
    channel: 'latest',
  },
  buildroot: {
    manifestUrl:
      'https://opentrons-buildroot-ci.s3.us-east-2.amazonaws.com/releases.json',
  },
  log: {
    level: {
      file: 'debug',
      console: 'info',
    },
  },
  ui: {
    width: 1024,
    height: 768,
    url: {
      protocol: 'file:',
      path: 'ui/index.html',
    },
    webPreferences: {
      webSecurity: true,
    },
  },
  analytics: {
    appId: 'mock-mixpanel-id',
    optedIn: false,
    seenOptIn: false,
  },

  // deprecated warning flag
  p10WarningSeen: {
    'some-id': true,
  },

  // user support (intercom)
  support: {
    userId: 'mock-intercom-id',
    createdAt: 1589744281,
    name: 'Unknown User',
    email: null,
  },
  discovery: {
    candidates: [],
  },
  labware: {
    directory: '/Users/ot/Library/Application Support/Opentrons/labware',
  },
  alerts: {
    ignored: [],
  },
}

export const MOCK_CONFIG_V1: ConfigV1 = {
  ...MOCK_CONFIG_V0,
  version: 1,
  discovery: {
    ...MOCK_CONFIG_V0.discovery,
    disableCache: false,
  },
}

// @flow

import type { Config, ConfigV1 } from '@opentrons/app/src/config/ConfigTypes'

export const MOCK_CONFIG_V0: Config = {
  version: 0, // Default key added on boot if missing in configs
  devtools: false,
  reinstallDevtools: false,

  // app update config
  update: {
    channel: 'latest',
  },

  buildroot: {
    manifestUrl:
      'https://opentrons-buildroot-ci.s3.us-east-2.amazonaws.com/releases.json',
  },

  // logging config
  log: {
    level: {
      file: 'debug',
      console: 'info',
    },
  },

  // ui and browser config
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

  // analytics (mixpanel)
  analytics: {
    appId: 'abcdfc1-9012-42cf-809a-1d76034a35d',
    optedIn: false,
    seenOptIn: false,
  },

  // user support (intercom)
  support: {
    userId: '0220df78-5db3-4e0d-b8c7-c4f6c456d',
    createdAt: 1589744281,
    name: 'Unknown User',
    email: null,
  },

  // robot discovery
  discovery: {
    candidates: [],
  },

  // custom labware files
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
    candidates: [],
    disableDiscoveryCache: false,
  },
}

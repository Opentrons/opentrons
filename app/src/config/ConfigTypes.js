// @flow

export type ConfigV0 = $ReadOnly<{|
  configFileVersion: 0,
  devtools: boolean,
  reinstallDevtools: boolean,

  // app update config
  update: $ReadOnly<{|
    channel: UpdateChannel,
  |}>,

  // robot update config
  buildroot: $ReadOnly<{|
    manifestUrl: string,
  |}>,

  // logging config
  log: $ReadOnly<{|
    level: $ReadOnly<{|
      file: LogLevel,
      console: LogLevel,
    |}>,
  |}>,

  // ui and browser config
  ui: $ReadOnly<{|
    width: number,
    height: number,
    url: $ReadOnly<{|
      protocol: UrlProtocol,
      path: string,
    |}>,
    webPreferences: $ReadOnly<{|
      webSecurity: boolean,
    |}>,
  |}>,

  analytics: $ReadOnly<{|
    appId: string,
    optedIn: boolean,
    seenOptIn: boolean,
  |}>,

  // deprecated; remove with first migration
  p10WarningSeen: $ReadOnly<{|
    [id: string]: ?boolean,
  |}>,

  support: $ReadOnly<{|
    userId: string,
    createdAt: number,
    name: string,
    email: ?string,
  |}>,

  discovery: $ReadOnly<{|
    candidates: DiscoveryCandidates,
  |}>,

  // custom labware files
  labware: $ReadOnly<{|
    directory: string,
  |}>,

  // app wide alerts
  alerts: $ReadOnly<{| ignored: $ReadOnlyArray<string> |}>,

  // internal development flags
  devInternal?: $ReadOnly<FeatureFlags>,
|}>

export type ConfigV1 = $ReadOnly<{|
  ...ConfigV0,
  version: 1,
  discovery: $ReadOnly<{|
    candidates: DiscoveryCandidates,
    disableDiscoveryCache: boolean,
  |}>,
|}>

export type Config =
  | ConfigV0
  | ConfigV1

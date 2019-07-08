// @flow

// TODO(mc, 2019-07-02): remove some fields from this object
export type ReleaseSetUrls = {
  // not needed by the app
  fullImage: string,
  system: string,
  // not needed by the app
  version: string,
  // unused, possible deprecated
  migration: string,
  // is this truly optional?
  releaseNotes?: string,
}

export type ReleaseManifest = {
  production: {
    [version: string]: ReleaseSetUrls | void,
  },
}

export type ReleaseSetFilepaths = {
  system: string,
  releaseNotes: string | null,
}

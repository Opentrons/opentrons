// @flow

export type ReleaseSetUrls = {
  fullImage: string,
  system: string,
  version: string,
  releaseNotes: string,
}

export type ReleaseManifest = {
  production: {
    [version: string]: ReleaseSetUrls | void,
  },
}

export type ReleaseSetFilepaths = {
  system: string,
  releaseNotes: string,
}

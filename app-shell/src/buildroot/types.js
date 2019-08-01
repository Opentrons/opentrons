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

// shape of VERSION.json in update file
export type VersionInfo = {
  buildroot_version: string,
  buildroot_sha: string,
  buildroot_branch: string,
  buildroot_buildid: string,
  build_type: string,
  opentrons_api_version: string,
  opentrons_api_sha: string,
  opentrons_api_branch: string,
  update_server_version: string,
  update_server_sha: string,
  update_server_branch: string,
}

export type UserFileInfo = {
  // filepath of update file
  systemFile: string,
  // parsed contents of VERSION.json
  versionInfo: VersionInfo,
}

export interface ReleaseSetUrls {
  fullImage: string
  system: string
  version: string
  releaseNotes?: string
}

export interface ReleaseManifest {
  production: {
    [version: string]: ReleaseSetUrls
  }
}

export interface ReleaseSetFilepaths {
  system: string
  releaseNotes: string | null
}

// shape of VERSION.json in update file
export interface VersionInfo {
  buildroot_version: string
  buildroot_sha: string
  buildroot_branch: string
  buildroot_buildid: string
  build_type: string
  opentrons_api_version: string
  opentrons_api_sha: string
  opentrons_api_branch: string
  update_server_version: string
  update_server_sha: string
  update_server_branch: string
}

export interface UserFileInfo {
  // filepath of update file
  systemFile: string
  // parsed contents of VERSION.json
  versionInfo: VersionInfo
}

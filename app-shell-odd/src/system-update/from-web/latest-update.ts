import semver from 'semver'

const channelFinder = (version: string, channel: string): boolean => {
  // return the latest alpha/beta if a user subscribes to alpha/beta updates
  if (['alpha', 'beta'].includes(channel)) {
    return version.includes(channel)
  } else {
    // otherwise get the latest stable version
    return !version.includes('alpha') && !version.includes('beta')
  }
}

export const latestVersionForChannel = (
  availableVersions: string[],
  channel: string
): string | null =>
  availableVersions
    .filter(version => channelFinder(version, channel))
    .sort((a, b) => (semver.gt(a, b) ? 1 : -1))
    .pop() ?? null

export const shouldUpdate = (
  currentVersion: string,
  availableVersion: string | null
): string | null =>
  availableVersion != null && currentVersion !== availableVersion
    ? availableVersion
    : null

import type { PathCrumb } from './types'

export function getLinkPath(pathCrumbs: PathCrumb[], i: number): string {
  const linkPath = `/${pathCrumbs
    // use all crumbs up to the current crumb
    .slice(0, i + 1)
    // construct path with original path segment
    .map(crumb => crumb.pathSegment)
    .join('/')}`

  return linkPath
}

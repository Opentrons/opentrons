import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'

import { translationKeyByPathSegment } from './constants'

import type { PathCrumb } from './types'

/**
 * a hook for the unified app, to generate an array of path crumbs
 * @returns {PathCrumb[]}
 */
export function usePathCrumbs(): PathCrumb[] {
  const { t } = useTranslation('top_navigation')

  const location = useLocation()
  const subPathname = location.pathname.substring(1)

  const pathCrumbs = subPathname
    .split('/')
    // filter out path segments explicitly defined as null
    .filter(crumb => translationKeyByPathSegment[crumb] !== null)
    .map(crumb => {
      const crumbDisplayNameValue = translationKeyByPathSegment[crumb]

      return {
        pathSegment: crumb,
        crumbName:
          crumbDisplayNameValue != null ? t(crumbDisplayNameValue) : crumb,
      }
    })

  return pathCrumbs
}

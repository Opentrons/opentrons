import { useSelector } from 'react-redux'
import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'

import { getIsOnDevice } from '../../redux/config'
import { getTranslationKeyByPathSegment } from './utils'

import type { PathCrumb } from './types'

/**
 * a hook for the unified app, to generate an array of path crumbs
 * @returns {PathCrumb[]}
 */
export function usePathCrumbs(): PathCrumb[] {
  const { t } = useTranslation('top_navigation')
  const isOnDevice = useSelector(getIsOnDevice)

  const location = useLocation()
  const subPathname = location.pathname.substring(1)

  const pathCrumbs = subPathname.split('/').flatMap(crumb => {
    const crumbDisplayNameValue = getTranslationKeyByPathSegment(isOnDevice)[
      crumb
    ]
    // filter out path segments explicitly defined as null
    return crumbDisplayNameValue !== null
      ? [
          {
            pathSegment: crumb,
            crumbName:
              crumbDisplayNameValue != null ? t(crumbDisplayNameValue) : crumb,
          },
        ]
      : []
  })

  return pathCrumbs
}

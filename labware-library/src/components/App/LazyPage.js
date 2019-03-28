// @flow
// default export is lazy-loaded so main bundle doesn't need labware defs
import * as React from 'react'

import type {PageProps} from './page'

// $FlowFixMe: need to upgrade Flow for React.lazy
export const Page = React.lazy(() => import('./Page'))

export default function LazyLabwareList (props: PageProps) {
  return (
    // $FlowFixMe: need to upgrade Flow for React.Suspense
    <React.Suspense fallback={null}>
      <Page {...props} />
    </React.Suspense>
  )
}

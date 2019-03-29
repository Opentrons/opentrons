// @flow
// default export is lazy-loaded LabwareList so initial bundle doesn't need
// labware defs
import * as React from 'react'

// $FlowFixMe: need to upgrade Flow for React.lazy
export const LabwareList = React.lazy(() => import('./LabwareList'))

export default function LazyLabwareList () {
  return (
    // $FlowFixMe: need to upgrade Flow for React.Suspense
    <React.Suspense fallback={null}>
      <LabwareList />
    </React.Suspense>
  )
}

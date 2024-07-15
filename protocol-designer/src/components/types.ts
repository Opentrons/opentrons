import type * as React from 'react'

export interface RouteProps {
  /** the component rendered by a route match
   * drop developed components into slots held by placeholder div components
   * */
  Component: React.FC
  /** a route/page name to render in the nav bar
   */
  name: string
  /** the path for navigation linking, for example to push to a default tab
   */
  path: string
  navLinkTo: string
}

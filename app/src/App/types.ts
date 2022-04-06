export interface RouteProps {
  /**
   * the component rendered by a route match
   * drop developed components into slots held by placeholder div components
   */
  component: () => JSX.Element | null
  exact?: boolean
  /**
   * a route/page name to render in the temp nav bar
   */
  name: string
  /**
   * the path for navigation linking, for example to push to a default tab
   * some of these links are temp (and params hardcoded) until final nav and breadcrumbs implemented
   */
  navLinkTo?: string
  path: string
}

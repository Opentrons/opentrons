export interface RouteProps {
  /**
   * the component rendered by a route match
   * drop developed components into slots held by placeholder div components
   */
  component: () => JSX.Element | null
  exact?: boolean
  /**
   * a route/page name to render in the nav bar
   */
  name: string
  /**
   * the path for navigation linking, for example to push to a default tab
   * some of these links are temp (and params hardcoded) until final nav and breadcrumbs implemented
   */
  navLinkTo?: string
  path: string
}

export type RobotSettingsTab = 'calibration' | 'networking' | 'advanced'

export type AppSettingsTab =
  | 'general'
  | 'privacy'
  | 'advanced'
  | 'feature-flags'

export type ProtocolRunDetailsTab = 'setup' | 'module-controls' | 'run-log'

/**
 * route params type definition for the next gen app
 */
export interface NextGenRouteParams {
  appSettingsTab: AppSettingsTab
  robotName: string
  protocolKey: string
  labwareId: string
  robotSettingsTab: RobotSettingsTab
  runId: string
  protocolRunDetailsTab: ProtocolRunDetailsTab
}

import type { FC } from 'react'

export interface RouteProps {
  /**
   * the component rendered by a route match
   * drop developed components into slots held by placeholder div components
   */
  Component: FC
  /**
   * a route/page name to render in the nav bar
   */
  name: string
  /**
   * the path for navigation linking, for example to push to a default tab
   */
  navLinkTo?: string
  path: string
}

export type RobotSettingsTab =
  | 'calibration'
  | 'networking'
  | 'camera'
  | 'file-manager'
  | 'advanced'
  | 'compliance-ready'
  | 'feature-flags'

export type AppSettingsTab =
  'general' | 'privacy' | 'advanced' | 'feature-flags'

export type ProtocolRunDetailsTab =
  'setup' | 'module-controls' | 'run-preview' | 'runtime-parameters' | 'camera'

/**
 * desktop app route params type definition
 */
export interface DesktopRouteParams {
  appSettingsTab: AppSettingsTab
  robotName: string
  protocolKey: string
  labwareId: string
  robotSettingsTab: RobotSettingsTab
  runId: string
  protocolRunDetailsTab: ProtocolRunDetailsTab
  runCreatedAtTimestamp: string
}

/**
 * on device display app route params type definition
 */
export interface OnDeviceRouteParams {
  protocolId: string
  runId: string
  quickTransferId: string
}

/* The type of electron-created window.
 * Main: Renders DesktopApp/OnDeviceDisplay
 * Secondary: Renders SecondaryWindowApp
 * */
export type WindowType = 'desktop-main' | 'odd-main' | 'secondary' | null

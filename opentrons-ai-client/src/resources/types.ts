/** assistant: ChatGPT API, user: user */
type Role = 'assistant' | 'user'

export interface ChatData {
  /** assistant: ChatGPT API, user: user */
  role: Role
  /** content ChatGPT API return or user prompt */
  reply: string
  /** for testing purpose will be removed and this is not used in the app */
  fake?: boolean
}

export interface Chat {
  /** assistant: ChatGPT API, user: user */
  role: Role
  /** content ChatGPT API return or user prompt */
  content: string
}

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

export interface Mixpanel {
  analytics: {
    hasOptedIn: boolean
  }
  isInitialized: boolean
}

export interface AnalyticsEvent {
  name: string
  properties: Record<string, unknown>
  superProperties?: Record<string, unknown>
}

export interface HeaderWithMeterAtomProps {
  displayHeaderWithMeter: boolean
  progress: number
}

export interface createProtocolAtomProps {
  currentStep: number
  focusStep: number
}

export interface PromptData {
  /** assistant: ChatGPT API, user: user */
  role: Role
  /** content gathered from the user selection */
  data: {
    applicationSection: {
      application: string
      description: string
    }
    instrumentsSection: {
      robot: string
      instruments: string[]
    }
  }
}

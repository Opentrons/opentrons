import type { MouseEvent } from 'react'

export type MenuName =
  | 'About'
  | 'Products'
  | 'Applications'
  | 'Protocols'
  | 'Support'

export interface Link {
  name: string
  url?: string
  to?: string
  description?: string
  cta?: boolean
  gtm: {
    action: string
    category: string
    label: string
  }
}

export interface Submenu {
  name: MenuName
  links: Link[]
  bottomLink?: Link
}

export type ProtocolSubmenuName =
  | 'options'
  | 'designer'
  | 'library'
  | 'api'
  | 'github'

export type ProtocolLinks = Record<ProtocolSubmenuName, Link> & {
  bottomLink: Link
}

export type SupportSubmenuName =
  | 'start'
  | 'help'
  | 'github'
  | 'labware'
  | 'app'
  | 'warranty'
  | 'protocol'
  | 'support'

export type SupportLinks = Record<SupportSubmenuName, Link>

export type SalesSubmenuName = 'order' | 'sales' | 'demo'

export type SalesLinks = Record<SalesSubmenuName, Link>

export interface MobileNavProps {
  isMobileOpen?: boolean
  onMobileClick?: (event: MouseEvent) => unknown
}

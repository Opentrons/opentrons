// @flow

export type MenuName =
  | 'About'
  | 'Products'
  | 'Applications'
  | 'Protocols'
  | 'Support'

export type Link = {|
  name: string,
  url?: string,
  to?: string, // TODO: (ka 2019-4-18): refactor component to take ?Links
  description?: string,
  cta?: boolean,
|}

export type Submenu = {|
  name: MenuName,
  links: Array<Link>,
  bottomLink?: Link,
|}

export type ProtocolSubmenuName =
  | 'options'
  | 'designer'
  | 'library'
  | 'api'
  | 'github'

export type ProtocolLinks = {
  [ProtocolSubmenuName]: Link,
  bottomLink: Link,
}

export type SupportSubmenuName =
  | 'start'
  | 'help'
  | 'github'
  | 'labware'
  | 'app'
  | 'protocol'
  | 'support'

export type SupportLinks = {
  [SupportSubmenuName]: Link,
}

export type SalesSubmenuName = 'order' | 'sales' | 'demo'

export type SalesLinks = {
  [SalesSubmenuName]: Link,
}

export type MobileNavProps = {|
  isMobileOpen: boolean,
  onMobileClick?: (event: SyntheticMouseEvent<>) => mixed,
|}

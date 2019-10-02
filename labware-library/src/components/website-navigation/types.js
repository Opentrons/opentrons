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
  to?: string,
  description?: string,
  cta?: boolean,
  gtm: {
    action: string,
    category: string,
    label: string,
  },
|}

export type Submenu = {|
  name: MenuName,
  links: Array<Link>,
  bottomLink?: Link,
|}

export type ProductSubmenuName =
  | 'robot'
  | 'pipettes'
  | 'thermocycler'
  | 'magdeck'
  | 'tempdeck'
  | 'tips'
  | 'reagents'
  | 'tubes'
  | 'plates'
  | 'reservoirs'
  | 'tubeRacks'

export type ProductLinks = {
  [ProductSubmenuName]: Link,
}

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
  | 'warranty'
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
  isMobileOpen?: boolean,
  onMobileClick?: (event: SyntheticMouseEvent<>) => mixed,
|}

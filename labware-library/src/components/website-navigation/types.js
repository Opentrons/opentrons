// @flow

export type MenuName =
  | 'about'
  | 'products'
  | 'applications'
  | 'protocols'
  | 'support'

export type Link = {|
  name: string,
  url?: string,
  to?: string, // TODO: (ka 2019-4-18): refactor component to take ?Links
|}

export type Submenu = {|
  name: MenuName,
  links: Array<Link>,
  bottomLink?: Link,
|}

// @flow

export type MobileNavProps = {|
  isMobileOpen?: boolean,
  onMobileClick?: (event: SyntheticMouseEvent<>) => mixed,
|}

export type Submenu = {|
  name?: string,
  links?: Array<Submenu>,
  active?: boolean,
  text?: string,
  url?: string,
  description?: string,
  cta?: boolean,
  gtm?: {
    action: string,
    category: string,
    label: string,
  },
  linkout?: boolean,
|}

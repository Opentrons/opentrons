// @flow
import * as React from 'react'

// TODO make this a component library component?
type Props = {|
  href: string,
  className?: ?string,
  children?: React.Node,
  onClick?: () => mixed,
|}
export const LinkOut = (props: Props): React.Node => (
  <a
    onClick={props.onClick}
    className={props.className}
    href={props.href}
    target="_blank"
    rel="noopener noreferrer"
  >
    {props.children}
  </a>
)

// @flow
import * as React from 'react'

// TODO make this a component library component?
type Props = {|
  href: string,
  className?: ?string,
  children?: React.Node,
|}
const LinkOut = (props: Props) => (
  <a
    className={props.className}
    href={props.href}
    target="_blank"
    rel="noopener noreferrer"
  >
    {props.children}
  </a>
)

export default LinkOut

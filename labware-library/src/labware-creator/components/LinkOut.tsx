import * as React from 'react'

// TODO make this a component library component?
interface Props {
  href: string
  className?: string | undefined
  children?: React.ReactNode
  onClick?: () => unknown
}
export const LinkOut = (props: Props): JSX.Element => (
  <a
    onClick={props.onClick}
    className={props.className}
    href={props.href}
    target="_blank"
    rel="noopener noreferrer"
    role="button"
  >
    {props.children}
  </a>
)

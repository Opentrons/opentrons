import type { ElementType } from 'react'

type TextProps<T extends ElementType> = {
  as?: T
  className?: string
  children?: React.ReactNode
} & React.ComponentPropsWithoutRef<T>

export function Text<T extends ElementType = 'p'>(
  props: TextProps<T>
): JSX.Element {
  const { as, className, children, ...rest } = props
  const Component = as || 'p'
  return (
    <Component className={className} {...rest}>
      {children}
    </Component>
  )
}

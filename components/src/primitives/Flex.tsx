import React from 'react'

const stylePropKeys = [
  'alignItems',
  'alignSelf',
  'justifyContent',
  'flex',
  'flexDirection',
  'flexWrap',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'gap',
  'gridGap',
  'rowGap',
  'columnGap',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'width',
  'height',
  'color',
  'backgroundColor',
  'overflow',
  'overflowX',
  'overflowY',
  'borderRadius',
  'zIndex',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'cursor',
  'border',
  'boxShadow',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'opacity',
  'borderBottom',
  'onFocus',
  'onBlur',
] as const
type StyleProps = Partial<Record<typeof stylePropKeys[number], string | number>>
type FlexProps = React.HTMLAttributes<HTMLDivElement> & StyleProps
const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ children, className, ...props }, ref) => {
    const style: React.CSSProperties = {
      display: 'flex',
    }
    const forwardedProps: { [key: string]: any } = {}
    for (const key in props) {
      if (Object.prototype.hasOwnProperty.call(props, key)) {
        if ((stylePropKeys as readonly string[]).includes(key)) {
          ;(style as any)[key] = (props as any)[key]
        } else {
          forwardedProps[key] = (props as any)[key]
        }
      }
    }
    return (
      <div ref={ref} className={className} style={style} {...forwardedProps}>
        {typeof children === 'object' &&
        !Array.isArray(children) &&
        !React.isValidElement(children)
          ? null
          : React.Children.toArray(children)}
      </div>
    )
  }
)
Flex.displayName = 'Flex'
export { Flex }

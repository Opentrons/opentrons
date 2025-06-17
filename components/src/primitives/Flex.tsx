import React from 'react'

const stylePropKeys = [
  'alignItems',
  'alignSelf',
  'backgroundColor',
  'border',
  'borderBottom',
  'borderRadius',
  'bottom',
  'boxShadow',
  'color',
  'columnGap',
  'cursor',
  'flex',
  'flexBasis',
  'flexDirection',
  'flexGrow',
  'flexShrink',
  'flexWrap',
  'gap',
  'gridGap',
  'height',
  'justifyContent',
  'left',
  'margin',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginTop',
  'maxHeight',
  'maxWidth',
  'minHeight',
  'minWidth',
  'onBlur',
  'onFocus',
  'opacity',
  'overflow',
  'overflowX',
  'overflowY',
  'padding',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'position',
  'right',
  'rowGap',
  'top',
  'width',
  'zIndex',
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

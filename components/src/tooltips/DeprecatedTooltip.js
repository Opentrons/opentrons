// @flow

import * as React from 'react'
import { Manager, Reference, Popper } from 'react-popper'
import cx from 'classnames'
import styles from './tooltips.css'

const DISTANCE_FROM_REFERENCE = 8

type PopperProps = React.ElementProps<typeof Popper>

export type TooltipChildProps<ChildProps: {}> = {|
  ...$Exact<ChildProps>,
  ref: React.Ref<*>,
|}

export type DeprecatedTooltipProps<ChildProps: {}> = {|
  /** show or hide the tooltip */
  open?: boolean,
  /** contents of the tooltip */
  tooltipComponent?: React.Node,
  /** optional portal to place the tooltipComponent inside */
  portal?: React.ComponentType<*>,
  /** <https://github.com/FezVrasta/react-popper#placement> */
  placement?: $PropertyType<PopperProps, 'placement'>,
  /** <https://github.com/FezVrasta/react-popper#positionfixed> */
  positionFixed?: $PropertyType<PopperProps, 'positionFixed'>,
  /** <https://github.com/FezVrasta/react-popper#modifiers> */
  modifiers?: $PropertyType<PopperProps, 'modifiers'>,
  /** render function for tooltip'd component */
  children: (props?: TooltipChildProps<ChildProps>) => React.Node,
  /** extra props to pass to the children render function */
  childProps?: ChildProps,
|}

/**
 *  Basic, fully controlled Tooltip component.
 *
 * `props.children` is a function that receives the following props object:
 * ```js
 * type TooltipChildProps = {|
 *   ref: React.Ref<*>,
 * |}
 * ```
 *
 * `props.childProps` can be used to add extra fields to the child props object
 *
 * @deprecated Use `Tooltip` and `useTooltip` instead
 */
export function DeprecatedTooltip<ChildProps: {}>(
  props: DeprecatedTooltipProps<ChildProps>
): React.Node {
  if (!props.tooltipComponent) return props.children()

  return (
    <Manager>
      <Reference>
        {// TODO(mc, 2020-02-21): this is pretty hard to type as is, ref
        // should probably be a whole separate argument to children
        // this may become a moot point if we switch tooltips to hooks
        // $FlowFixMe(mc, 2020-02-21): Error from Flow 0.118 upgrade
        ({ ref }) => props.children({ ...props.childProps, ref })}
      </Reference>
      {props.open && (
        <Popper
          placement={props.placement}
          modifiers={{
            offset: { offset: `0, ${DISTANCE_FROM_REFERENCE}` },
            ...props.modifiers,
          }}
          positionFixed={props.positionFixed}
        >
          {({ ref, style, placement, arrowProps }) => {
            // remove optional -start and -end modifiers for arrow style
            // https://popper.js.org/popper-documentation.html#Popper.placements
            const arrowPlacement = placement
              ? placement.replace(/-(?:start|end)/, '')
              : ''

            let { style: arrowStyle } = arrowProps
            if (arrowPlacement === 'left' || arrowPlacement === 'right') {
              arrowStyle = { top: '0.6em' }
            }
            const tooltipContents = (
              <div
                ref={ref}
                className={styles.tooltip_box}
                style={style}
                data-placement={placement}
              >
                {props.tooltipComponent}
                <div
                  className={cx(styles.arrow, styles[arrowPlacement])}
                  ref={arrowProps.ref}
                  style={arrowStyle}
                />
              </div>
            )

            if (props.portal) {
              const PortalClass = props.portal
              return <PortalClass>{tooltipContents}</PortalClass>
            }

            return tooltipContents
          }}
        </Popper>
      )}
    </Manager>
  )
}

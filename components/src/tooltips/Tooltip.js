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

export type TooltipProps<ChildProps: {}> = {|
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
 */
export function Tooltip<ChildProps: {}>(props: TooltipProps<ChildProps>) {
  if (!props.tooltipComponent) return props.children()

  return (
    <Manager>
      <Reference>
        {({ ref }) => props.children({ ...props.childProps, ref })}
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

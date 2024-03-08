import * as React from 'react'
import cx from 'classnames'
import { Icon, IconName } from '@opentrons/components'
import styles from './styles.module.css'

export interface Props {
  /** text of title */
  title: string
  /** icon left of the step */
  iconName: IconName
  /** props passed down to icon (`className` and `name` are ignored) */
  iconProps?: Omit<React.ComponentProps<typeof Icon>, 'name'>
  /** optional data test id for the container */
  'data-test'?: string
  /** children must all be `<li>` */
  children?: React.ReactNode
  /** additional classnames */
  className?: string
  /** component with descriptive text about the list */
  description?: React.ReactNode
  /** optional click action (on title div, not children) */
  onClick?: (event: React.MouseEvent) => unknown
  /** optional right click action (on wrapping div) */
  onContextMenu?: (event: React.MouseEvent) => unknown
  /** optional mouseEnter action */
  onMouseEnter?: (event: React.MouseEvent) => unknown
  /** optional mouseLeave action */
  onMouseLeave?: (event: React.MouseEvent) => unknown
  /** caret click action; if defined, list is expandable and carat is visible */
  onCollapseToggle?: (event: React.MouseEvent) => unknown
  /** collapse the list if true (false by default) */
  collapsed?: boolean
  /** set to true when Step is selected (eg, user clicked it) */
  selected?: boolean
  /** set to true when Step is hovered (but not when its contents are hovered) */
  hovered?: boolean
  /** show checkbox icons if true */
  isMultiSelectMode?: boolean
  /** set to true when Step is the last selected in multi select mode */
  isLastSelected?: boolean
}

export function TitledStepList(props: Props): JSX.Element {
  const {
    iconName,
    'data-test': dataTest,
    onCollapseToggle,
    iconProps,
    onMouseEnter,
    onMouseLeave,
    onContextMenu,
    isMultiSelectMode,
    isLastSelected,
  } = props
  const collapsible = onCollapseToggle != null

  const onClick = props.onClick

  // clicking on the carat will not call props.onClick,
  // so prevent bubbling up if there is an onCollapseToggle fn
  const handleCollapseToggle = (e: React.MouseEvent): void => {
    if (onCollapseToggle) {
      e.stopPropagation()
      onCollapseToggle(e)
    }
  }

  const hasValidChildren = React.Children.toArray(props.children).some(
    child => child
  )

  const className = cx(styles.pd_titled_list, props.className, {
    [styles.titled_list_selected]: props.selected,
    [styles.hover_border]: props.hovered,
  })

  // @ts-expect-error(sa, 2021-6-21): cast props.onClick to a boolean
  const titleBarClass = cx(styles.step_title_bar, {
    [styles.clickable]: props.onClick,
    [styles.multiselect_title_bar]: props.isMultiSelectMode,
  })

  const iconClass = cx(
    styles.title_bar_icon,
    styles.icon_left_of_title,
    iconProps && iconProps.className
  )

  const multiSelectIconName = props.selected
    ? 'checkbox-marked'
    : 'checkbox-blank-outline'

  return (
    <div
      className={className}
      data-test={dataTest}
      {...{ onMouseEnter, onMouseLeave, onContextMenu }}
    >
      <div onClick={onClick} className={titleBarClass}>
        {isMultiSelectMode && (
          <div
            className={cx(styles.multiselect_wrapper, {
              [styles.last_selected]: isLastSelected,
            })}
          >
            <Icon
              name={multiSelectIconName}
              className={styles.icon_multiselect}
            />
          </div>
        )}
        {iconName && (
          <Icon {...iconProps} className={iconClass} name={iconName} />
        )}
        <h3 className={styles.title}>{props.title}</h3>
        {collapsible && (
          <div
            onClick={handleCollapseToggle}
            className={styles.title_bar_carat}
          >
            <Icon
              className={styles.title_bar_icon}
              name={
                props.selected
                  ? 'chevron-right'
                  : props.collapsed
                  ? 'chevron-down'
                  : 'chevron-up'
              }
            />
          </div>
        )}
      </div>
      {!props.collapsed && props.description}
      {!props.collapsed && hasValidChildren && (
        <ol className={styles.list}>{props.children}</ol>
      )}
    </div>
  )
}

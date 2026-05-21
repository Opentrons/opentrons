import { StyledText } from '../../atoms'
import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import styles from './stepgroup.module.css'

import type { MouseEventHandler, ReactNode } from 'react'

interface StepGroupProps {
  title: string
  isExpand: boolean
  isActive: boolean
  handleClick: () => void
  children: ReactNode
  subtitle?: string
  // currently used as an error icon to display if the group has an error
  headerPrefixIcon?: ReactNode | null
  /** Rendered 4px left of the title; clicks do not toggle expand/collapse */
  headerLeading?: ReactNode
  /** Rendered before the expand chevron; clicks do not toggle expand/collapse */
  headerTrailing?: ReactNode
  /** Title text color (e.g. COLORS.purple50) */
  titleColor?: string
}

export function StepGroup(props: StepGroupProps): JSX.Element {
  const {
    title,
    isExpand,
    subtitle,
    isActive,
    handleClick,
    children,
    headerPrefixIcon,
    headerLeading,
    headerTrailing,
    titleColor,
  } = props

  const handleChildrenClick: MouseEventHandler<HTMLDivElement> = event => {
    event.stopPropagation()
  }

  const titleBlockClassName =
    headerLeading != null
      ? styles.step_group_title_block_grid
      : styles.step_group_title_block_stacked

  const titleArea = (
    <div className={titleBlockClassName}>
      {headerLeading != null ? (
        <>
          <div
            className={styles.step_group_leading}
            onClick={event => {
              event.stopPropagation()
            }}
          >
            {headerLeading}
          </div>
          <div className={styles.step_group_title_line}>
            <StyledText desktopStyle="bodyDefaultSemiBold" color={titleColor}>
              {title}
            </StyledText>
          </div>
          {subtitle != null ? (
            <div className={styles.step_group_subtitle_line}>
              <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
                {subtitle}
              </StyledText>
            </div>
          ) : null}
        </>
      ) : (
        <div className={styles.step_group_title_content}>
          <StyledText desktopStyle="bodyDefaultRegular" color={titleColor}>
            {title}
          </StyledText>
          {subtitle != null ? (
            <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
              {subtitle}
            </StyledText>
          ) : null}
        </div>
      )}
    </div>
  )

  return (
    <div
      className={styles.step_group_container}
      style={{
        //  color based off of designs
        backgroundColor: isActive ? '#F3E9F6' : COLORS.grey20,
      }}
    >
      <div className={styles.step_group_header} onClick={handleClick}>
        {headerPrefixIcon != null ? (
          <div className={styles.step_group_header_left}>
            <div
              className={styles.step_group_prefix}
              onClick={event => {
                event.stopPropagation()
              }}
            >
              {headerPrefixIcon}
            </div>
            {titleArea}
          </div>
        ) : (
          titleArea
        )}
        <div className={styles.step_group_header_right}>
          {headerTrailing != null ? (
            <div
              className={styles.step_group_trailing}
              onClick={event => {
                event.stopPropagation()
              }}
            >
              {headerTrailing}
            </div>
          ) : null}
          <div className={styles.step_group_chevron_wrap}>
            <Icon
              name={isExpand ? 'chevron-up' : 'chevron-down'}
              size="1.2rem"
            />
          </div>
        </div>
      </div>
      {isExpand ? <div onClick={handleChildrenClick}>{children}</div> : null}
    </div>
  )
}

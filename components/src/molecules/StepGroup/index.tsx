import { StyledText } from '../../atoms'
import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import styles from './stepgroup.module.css'

import type { ReactNode } from 'react'

interface StepGroupProps {
  title: string
  isExpand: boolean
  isActive: boolean
  handleClick: () => void
  children: ReactNode
  subtitle?: string
}

export function StepGroup(props: StepGroupProps): JSX.Element {
  const { title, isExpand, subtitle, isActive, handleClick, children } = props
  return (
    <div
      className={styles.step_group_container}
      style={{
        backgroundColor: isActive ? '#F3E9F6' : COLORS.grey20,
      }}
    >
      <div className={styles.step_group_header} onClick={handleClick}>
        <div>
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.black90}>
            {title}
          </StyledText>
          {subtitle != null ? (
            <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
              {subtitle}
            </StyledText>
          ) : null}
        </div>
        <div className={styles.step_group_icon}>
          <Icon name={isExpand ? 'chevron-up' : 'chevron-down'} size="1.2rem" />
        </div>
      </div>
      {isExpand ? (
        <div
          onClick={e => {
            e.stopPropagation()
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

import {
  Btn,
  COLORS,
  Icon,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import styles from './setupstep.module.css'

import type { ReactNode } from 'react'

interface SetupStepProps {
  /** whether or not to show the full contents of the step */
  expanded: boolean
  /** always shown text name of the step */
  title: ReactNode
  /** always shown text that provides a one sentence explanation of the contents */
  description: string
  /* element to be shown beneath the description, if any. */
  descriptionElement: ReactNode
  /** callback that should toggle the expanded state (managed by parent) */
  toggleExpanded: () => void
  /** contents to be shown only when expanded */
  children: ReactNode
  /** element to be shown (right aligned) regardless of expanded state */
  rightElement: ReactNode
}

export function SetupStep({
  expanded,
  title,
  description,
  descriptionElement,
  toggleExpanded,
  children,
  rightElement,
}: SetupStepProps): ReactNode {
  return (
    <div className={styles.container}>
      <Btn textAlign={TYPOGRAPHY.textAlignLeft}>
        <div className={styles.outer_row_container}>
          <div className={styles.clickable_container} onClick={toggleExpanded}>
            <div className={styles.title_description_container}>
              <StyledText
                color={COLORS.black90}
                desktopStyle="bodyLargeSemiBold"
              >
                {title}
              </StyledText>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                color={COLORS.black90}
                className={styles.description_text}
              >
                {description}
              </StyledText>
              {descriptionElement}
            </div>
            <div className={styles.right_content_container}>
              {rightElement}
              <Icon
                color={COLORS.black90}
                size="1.5rem"
                className={styles.accordion_icon}
                name={expanded ? 'minus' : 'plus'}
              />
            </div>
          </div>
        </div>
      </Btn>
      <div
        data-testid={`SetupStep_content_${expanded ? 'expanded' : 'collapsed'}`}
        className={expanded ? styles.expanded : styles.collapsed}
        onTransitionEnd={e => {
          // HACK:
          // There's some kind of Chromium bug where, when the section expands,
          // the contents will sometimes be left only partially painted, i.e. partially
          // missing. They'll remain that way until something like a screen resize
          // happens to force a repaint. It seems to happen more when there are
          // performance problems (dropped frames and partially-presented frames) and
          // when the section contents land partially below the fold.
          forceRepaint(e.currentTarget)
        }}
      >
        {children}
      </div>
    </div>
  )
}

// https://stackoverflow.com/questions/3485365
function forceRepaint(element: HTMLElement): void {
  element.style.display = 'none'
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  element.offsetHeight // no need to store this anywhere, the reference is enough
  element.style.display = ''
}

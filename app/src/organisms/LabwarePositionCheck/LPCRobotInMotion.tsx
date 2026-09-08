import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  DIRECTION_COLUMN,
  Icon,
  RESPONSIVENESS,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'
import { getIsOnDevice } from '/app/redux/config'

import styles from './lpcrobotinmotion.module.css'

import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'

interface RobotMotionLoaderProps extends LPCWizardContentProps {
  header?: string
  body?: string
}

export function LPCRobotInMotion(props: RobotMotionLoaderProps): JSX.Element {
  const { header, body } = props
  const { t } = useTranslation('labware_position_check')
  const isOnDevice = useSelector(getIsOnDevice)

  return (
    <LPCContentContainer
      {...props}
      header={t('labware_position_check_title')}
      contentStyle={isOnDevice ? CHILDREN_CONTAINER_STYLE : undefined}
      oddHeaderBtnCopy="NO_COPY"
      desktopHeaderBtnCopy="NO_COPY"
      desktopFooterBtnCopy="NO_COPY"
    >
      <div className={styles.container}>
        <Icon name="ot-spinner" spin className={styles.spinner} />
        {header != null ? (
          <StyledText
            oddStyle="level3HeaderBold"
            desktopStyle="headingSmallBold"
          >
            {header}
          </StyledText>
        ) : null}
        {body != null ? (
          <StyledText
            oddStyle="level4HeaderRegular"
            desktopStyle="bodyDefaultRegular"
          >
            {body}
          </StyledText>
        ) : null}
      </div>
    </LPCContentContainer>
  )
}

// The design system makes a padding exception for this view.
const CHILDREN_CONTAINER_STYLE = css`
  margin-top: 7.75rem;
  flex-direction: ${DIRECTION_COLUMN};
  height: 100%;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    padding: 0 ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60};
    gap: ${SPACING.spacing40};
  }
`

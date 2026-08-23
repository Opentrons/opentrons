import { useTranslation } from 'react-i18next'

import { Chip, ListItem, StyledText } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { Skeleton } from '/app/atoms/Skeleton'

import styles from './media.module.css'

import type { ReactNode } from 'react'

export interface ODDMEdiaContainerContentProps {
  leftPrimaryText: string
  centerPrimaryText: string
  rightButtonOnClick: () => void
  state: 'loading' | 'error' | null
  rightButtonText: string
  centerSecondaryText: string | null
}

export function ODDMediaContainerContent(
  props: ODDMEdiaContainerContentProps
): ReactNode {
  const {
    leftPrimaryText,
    centerPrimaryText,
    centerSecondaryText,
    rightButtonOnClick,
    rightButtonText,
    state,
  } = props
  const { t } = useTranslation(['run_details', 'branded'])
  const isLoading = state === 'loading'
  const isError = state === 'error'
  return (
    <>
      <ListItem type="default">
        <div className={styles.list_item_container}>
          <div className={styles.list_item_content_container}>
            <div>
              {isLoading ? (
                <Skeleton width="100%" height="100%" backgroundSize="47rem" />
              ) : (
                <StyledText oddStyle="bodyTextSemiBold">
                  {leftPrimaryText}
                </StyledText>
              )}
            </div>
            <div className={styles.list_item_step}>
              {isError && (
                <Chip
                  text={t('error_event')}
                  type="error"
                  width="fit-content"
                  chipSize="small"
                />
              )}
              {isLoading ? (
                <Skeleton width="100%" height="100%" backgroundSize="47rem" />
              ) : (
                <StyledText
                  className={styles.list_item_step_text}
                  oddStyle="bodyTextSemiBold"
                >
                  {centerPrimaryText}
                </StyledText>
              )}
              {isLoading ? (
                <Skeleton width="100%" height="100%" backgroundSize="47rem" />
              ) : (
                <StyledText
                  className={styles.list_item_step_text}
                  oddStyle="bodyTextRegular"
                >
                  {centerSecondaryText}
                </StyledText>
              )}
            </div>
            {isLoading ? (
              <Skeleton width="100%" height="100%" backgroundSize="47rem" />
            ) : (
              <SmallButton
                onClick={() => {
                  rightButtonOnClick()
                }}
                buttonText={rightButtonText}
                buttonType="secondary"
                buttonCategory="rounded"
              />
            )}
          </div>
        </div>
      </ListItem>
    </>
  )
}

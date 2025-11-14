import { useTranslation } from 'react-i18next'

import { Chip, ListItem, StyledText } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { Skeleton } from '/app/atoms/Skeleton'

import styles from './media.module.css'

export interface ODDMEdiaContainerContentProps {
  leftPrimaryText: string
  centerPrimaryText: string
  rightButtonOnClick: () => void
  state: 'loading' | null
  rightButtonText: string
  centerSecondaryText: string | null
  isCurrentCmdError: boolean | null
}

export function ODDMediaContainerContent(
  props: ODDMEdiaContainerContentProps
): JSX.Element {
  const {
    leftPrimaryText,
    centerPrimaryText,
    centerSecondaryText,
    rightButtonOnClick,
    rightButtonText,
    state,
    isCurrentCmdError,
  } = props
  const { t } = useTranslation(['run_details', 'branded'])
  const isLoading = state === 'loading'
  return (
    <>
      <ListItem type="default">
        <div className={styles.list_item_container}>
          <div className={styles.list_item_content_container}>
            <div>
              {isLoading ? (<Skeleton width="100%" height="100%" backgroundSize="47rem" />):
               <StyledText oddStyle="bodyTextSemiBold">
                {leftPrimaryText}
              </StyledText>
              }
             
            </div>
            <div className={styles.list_item_step}>
              {!isLoading && isCurrentCmdError && (
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
            {!isLoading && (
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

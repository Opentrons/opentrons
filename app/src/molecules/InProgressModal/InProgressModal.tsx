import { Flex, Icon, LegacyStyledText } from '@opentrons/components'

import styles from './inprogressmodal.module.css'

import type { ReactNode } from 'react'

interface Props {
  //  optional override of the spinner
  alternativeSpinner?: ReactNode
  description?: string
  body?: string
  children?: JSX.Element
}

export function InProgressModal(props: Props): ReactNode {
  const { alternativeSpinner, children, description, body } = props

  return (
    <Flex className={styles.modal}>
      {alternativeSpinner ?? (
        <Icon
          className={styles.spinner}
          name="ot-spinner"
          aria-label="spinner"
          spin
        />
      )}
      <Flex className={styles.description_container}>
        {description != null && (
          <LegacyStyledText className={styles.description}>
            {description}
          </LegacyStyledText>
        )}
        {body != null && (
          <LegacyStyledText className={styles.body}>{body}</LegacyStyledText>
        )}
      </Flex>
      {children}
    </Flex>
  )
}

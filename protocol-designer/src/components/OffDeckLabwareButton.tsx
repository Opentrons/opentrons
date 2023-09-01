import * as React from 'react'
import { DeprecatedPrimaryButton } from '@opentrons/components'
import { OffDeckLabwareSlideout } from './OffDeckLabwareSlideout'
import styles from './listButtons.css'

interface OffDeckLabwareButtonProps {
  hasOrderedStepIds: boolean
}

export const OffDeckLabwareButton = (
  props: OffDeckLabwareButtonProps
): JSX.Element => {
  const { hasOrderedStepIds } = props
  const [showSlideout, setShowSlideout] = React.useState<boolean>(false)

  return (
    <>
      <div className={styles.list_item_button}>
        <DeprecatedPrimaryButton onClick={() => setShowSlideout(true)}>
          {'edit off deck labware'}
        </DeprecatedPrimaryButton>
      </div>
      {showSlideout ? (
        <OffDeckLabwareSlideout
          isExpanded={showSlideout}
          onCloseClick={() => setShowSlideout(false)}
          hasOrderedStepIds={hasOrderedStepIds}
        />
      ) : null}
    </>
  )
}

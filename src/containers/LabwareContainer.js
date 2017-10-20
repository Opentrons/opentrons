import React from 'react'
import { connect } from 'react-redux'

import styles from '../css/style.css'

import { selectors } from '../reducers'
import { openIngredientSelector, deleteContainer } from '../actions'

// TODO: use container component instead
const getPlateTopdownImg = containerName => {
  const getUrl = imageFileName => `https://s3.amazonaws.com/opentrons-images/website/labware/${imageFileName}.png`

  const plates96 = [
    '96-deep',
    '96-tall',
    '96-flat'
  ]

  const noImage = [
    '96-custom',
    'PCR-strip-tall'
  ]

  if (plates96.some(x => x === containerName)) {
    return getUrl('96-plate')
  }

  if (noImage.some(x => x === containerName)) {
    return getUrl('custom')
  }

  return getUrl(containerName)
}

const LabwareContainer = ({slotName, containerType, containerId, children, openIngredientSelector, deleteContainer}) => (
  <div className={styles.deckSlot}>
    {containerType
      ? <img src={getPlateTopdownImg(containerType)} />
      : <label>{slotName}</label>}

    {containerType && // if there's no containerType, assume it's empty
      <div className={styles.containerOverlay}>
        <div className={styles.containerOverlayAddIngred} onClick={() => openIngredientSelector({containerId, slotName, containerType})}>
          Add Ingredients
        </div>
        <div className={styles.containerOverlayRemove} onClick={() => deleteContainer({containerId, slotName, containerType})}>
          Remove {containerType}
        </div>
      </div>}

    {children}
  </div>
)

export default connect(
  (state, ownProps) => {
    const container = selectors.containersBySlot(state)[ownProps.slotName]
    return (container)
      ? { containerType: container.type, containerId: container.containerId, containerName: container.name }
      : {}
  },
  {
    openIngredientSelector,
    deleteContainer
  }
)(LabwareContainer)

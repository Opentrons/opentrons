import { useDispatch } from 'react-redux'

import { stepDetailViewerOpenAction } from '/app/redux/shell'

import styles from './tippickupcontainer.module.css'

interface TipPickupContainerProps {
  protocolKey: string
}

export function TipPickupContainer({
  protocolKey,
}: TipPickupContainerProps): JSX.Element {
  const dispatch = useDispatch()
  return (
    <div
      className={styles.container}
      onClick={() => dispatch(stepDetailViewerOpenAction(protocolKey))}
    >
      {'Tip Pickup Container'}
    </div>
  )
}

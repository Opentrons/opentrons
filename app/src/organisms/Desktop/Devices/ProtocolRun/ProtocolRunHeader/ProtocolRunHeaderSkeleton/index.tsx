import styles from './protocolrunheaderskeleton.module.css'

export function ProtocolRunHeaderSkeleton(): JSX.Element {
  return (
    <div
      className={styles.skeleton}
      role="status"
      data-testid="ProtocolRunHeaderSkeleton"
    />
  )
}

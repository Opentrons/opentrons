import styles from '../tipselectionwizard.module.css'

export function EightChannelFlexShadow(props: {
  x: number
  y: number
  width: number
  height: number
}): JSX.Element {
  const { x, y, width, height } = props
  return (
    <svg
      width={width}
      height={height}
      x={x}
      y={y}
      viewBox="0 0 157 296"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.shadow_overlay}
    >
      <path
        d="M1.70703 4.61404C1.70703 2.91471 3.08462 1.53711 4.78395 1.53711H152.476C154.176 1.53711 155.553 2.91469 155.553 4.61403V293.845H1.70703V4.61404Z"
        fill="#16212D"
        fillOpacity="0.2"
        stroke="#006CFA"
        strokeWidth="2.7881"
      />
    </svg>
  )
}

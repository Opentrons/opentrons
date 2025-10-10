import styles from '../tipselectionwizard.module.css'

export function SingleChannelFlexShadow(props: {
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
      viewBox="0 0 158 201"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.shadow_overlay}
    >
      <path
        d="M2 5.38963C2 3.69017 3.37768 2.3125 5.07714 2.3125H152.78C154.479 2.3125 155.857 3.69018 155.857 5.38964V199.249H2V5.38963Z"
        fill="#16212D"
        fill-opacity="0.2"
        stroke="#006CFA"
        stroke-width="2.79089"
      />
    </svg>
  )
}

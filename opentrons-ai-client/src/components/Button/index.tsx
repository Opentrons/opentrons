export interface ButtonProps {
  label: string
}

export const Button = ({ label }: ButtonProps) => {
  return <button style={{ fontSize: '2rem' }}>{label}</button>
}

export interface SubTaskCTA {
  label: string
  onClick: () => void
}

export interface SubTaskProps {
  activeIndex: [number, number] | null
  description: string
  subTaskIndex: number
  taskIndex: number
  title: string
  cta?: SubTaskCTA
  footer?: string
  isComplete?: boolean
}

export interface TaskProps extends Omit<SubTaskProps, 'subTaskIndex'> {
  subTasks: SubTaskProps[]
  taskListLength: number
}
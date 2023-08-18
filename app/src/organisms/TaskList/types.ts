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
  markedBad?: boolean
  generalClickHandler?: () => void
  generalTaskDisabledReason?: string | null
}

export interface TaskProps extends Omit<SubTaskProps, 'subTaskIndex'> {
  subTasks: SubTaskProps[]
  taskListLength: number
}

export interface TaskListProps {
  // activeIndex: a tuple [i, j] indicating activeTaskIndex i and activeSubtaskIndex j
  // null activeIndex: all tasks complete
  activeIndex: [number, number] | null
  taskList: TaskProps[]
  taskListStatus: string | null
  isLoading?: boolean
  generalTaskClickHandler?: () => void
  generalTaskDisabledReason?: string | null
}

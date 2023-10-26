interface SharedCommandAnnotationProperties {
  commandKeys: string[]
}
export type CustomCommandAnnotation = SharedCommandAnnotationProperties & {
  [key: string]: any
} & {
  annotationType: 'custom'
}
export interface SecondOrderCommandAnnotation
  extends SharedCommandAnnotationProperties {
  annotationType: 'secondOrderCommand'
  machineReadableName: string
  params: { [key: string]: any }
  userSpecifiedName?: string
  userSpecifiedDescription?: string
}
export type CommandAnnotation =
  | SecondOrderCommandAnnotation
  | CustomCommandAnnotation

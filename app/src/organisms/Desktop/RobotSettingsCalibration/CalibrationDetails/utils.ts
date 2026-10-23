import { format } from 'date-fns'

export const formatLastCalibrated = (lastModified: string): string => {
  return typeof lastModified === 'string'
    ? format(new Date(lastModified), 'M/d/yyyy HH:mm:ss')
    : 'Unknown'
}

import { generateRobotStateTimeline } from './generateRobotStateTimeline'

self.addEventListener('message', event => {
  const { data } = event
  console.log('worker got', data)

  const result = generateRobotStateTimeline(data)
  postMessage(result)
})

import * as React from 'react'
import { TaskList as TaskListComponent } from './'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Organisms/TaskList',
  component: TaskListComponent,
} as Meta

const Template: Story<
  React.ComponentProps<typeof TaskListComponent>
> = args => <TaskListComponent {...args} />

export const CompletedTaskList = Template.bind({})
CompletedTaskList.args = {
  activeIndex: null,
  taskList: [
    {
      title: 'task 1',
      description: 'this is the first task',
      footer: 'it happened at noon',
      subTasks: [
        {
          title: 'subtask 1',
          description: 'this is the first subtask',
          cta: {
            label: 'do this',
            onClick: () => console.log('click 1'),
          },
        },
      ],
    },
    {
      title: 'the second task',
      description:
        'the second task happens after the first, and has longer text so that we can see what it looks like with longer text',
      cta: {
        label: 'do the second thing',
        onClick: () => console.log('click 2'),
      },
      subTasks: [],
    },
    {
      title: 'a third task',
      description: 'we need a third task',
      subTasks: [
        {
          title: 'subtask 1',
          description: 'this is the first subtask',
          cta: {
            label: 'do this',
            onClick: () => console.log('click 1'),
          },
        },
        {
          title: 'subtask 2',
          description: 'this is the second subtask',
          cta: {
            label: 'calibrate this',
            onClick: () => console.log('click 1'),
          },
        },
        {
          title: 'subtask 3',
          description: 'this is the third subtask: it is complete',
          isComplete: true,
          cta: {
            label: 'calibrate this',
            onClick: () => console.log('click 1'),
          },
        },
      ],
    },
    {
      title: 'a fourth task',
      description: 'in the future',
      subTasks: [
        {
          title: 'subtask 1',
          description: 'this is the first subtask',
          cta: {
            label: 'do this',
            onClick: () => console.log('click 1'),
          },
        },
      ],
    },
    {
      title: 'task 5',
      description: 'already done',
      isComplete: true,
      cta: {
        label: 'redo',
        onClick: () => console.log('redo'),
      },
      subTasks: [],
    },
  ],
}

export const InProgressTaskList = Template.bind({})
InProgressTaskList.args = {
  activeIndex: [2, 1],
  taskList: [
    {
      title: 'task 1',
      description: 'this is the first task',
      footer: 'it happened at noon',
      subTasks: [
        {
          title: 'subtask 1',
          description: 'this is the first subtask',
          cta: {
            label: 'do this',
            onClick: () => console.log('click 1'),
          },
        },
      ],
    },
    {
      title: 'the second task',
      description:
        'the second task happens after the first, and has longer text so that we can see what it looks like with longer text',
      cta: {
        label: 'do the second thing',
        onClick: () => console.log('click 2'),
      },
      subTasks: [],
    },
    {
      title: 'a third task',
      description: 'we need a third task',
      subTasks: [
        {
          title: 'subtask 1',
          description: 'this is the first subtask',
          cta: {
            label: 'do this',
            onClick: () => console.log('click 1'),
          },
        },
        {
          title: 'subtask 2',
          description: 'this is the second subtask',
          cta: {
            label: 'calibrate this',
            onClick: () => console.log('click 1'),
          },
        },
        {
          title: 'subtask 3',
          description: 'this is the third subtask: it is complete',
          isComplete: true,
          cta: {
            label: 'calibrate this',
            onClick: () => console.log('click 1'),
          },
        },
      ],
    },
    {
      title: 'a fourth task',
      description: 'in the future',
      subTasks: [
        {
          title: 'subtask 1',
          description: 'this is the first subtask',
          cta: {
            label: 'do this',
            onClick: () => console.log('click 1'),
          },
        },
      ],
    },
    {
      title: 'task 5',
      description: 'already done',
      isComplete: true,
      cta: {
        label: 'redo',
        onClick: () => console.log('redo'),
      },
      subTasks: [],
    },
  ],
}

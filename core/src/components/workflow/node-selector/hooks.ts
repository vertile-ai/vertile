import { BLOCKS } from './constants'
import {
  TabsEnum,
  ToolTypeEnum,
} from './types'

export const useBlocks = () => {

  return BLOCKS.map((block) => {
    return {
      ...block,
      title: block.type,
    }
  })
}

export const useTabs = () => {

  return [
    {
      key: TabsEnum.Blocks,
      name: 'Blocks',
    },
    {
      key: TabsEnum.Tools,
      name: 'Tools',
    },
  ]
}

export const useToolTabs = () => {
  return [
    {
      key: ToolTypeEnum.All,
      name: 'All Tools',
    },
    {
      key: ToolTypeEnum.BuiltIn,
      name: 'Built-in Tools',
    },
    {
      key: ToolTypeEnum.Custom,
      name: 'Custom Tools',
    },
    {
      key: ToolTypeEnum.Workflow,
      name: 'Workflow Tools',
    },
  ]
}

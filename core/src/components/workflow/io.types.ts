export enum IOType {
  text = 'text',
  kv = 'kv',
  llm = 'llm',
  file = 'file',
  md = 'md',
}


export const IOTypeLabels: Record<IOType, string> = {
  [IOType.text]: 'Text',
  [IOType.kv]: 'Key-Value Pairs',
  [IOType.llm]: 'LLM',
  [IOType.file]: 'File',
  [IOType.md]: 'Markdown',
};

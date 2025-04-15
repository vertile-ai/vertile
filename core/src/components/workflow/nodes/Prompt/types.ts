import { IOType } from "../../io.types";
import { GraphNode } from "../../types";

export interface PromptNode extends GraphNode {
  title: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
}

export const PromptNodeIO = {
  inputTypes: [IOType.llm],
  outputTypes: [IOType.text],
}

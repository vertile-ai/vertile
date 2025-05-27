import { CommonNodeType } from '../types';

export interface PromptNodeType extends CommonNodeType {
  title: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  promptTemplate: string;
  description?: string;
}

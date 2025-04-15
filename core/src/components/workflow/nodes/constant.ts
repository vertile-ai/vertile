import { AllNodeTypes, BlockEnum } from "../types";
import StartNode from "./start";
import IfElseNode from "./if-else";
import DatasetNode from "./Dataset";
import ModelNode from "./Model";
import TrainNode from "./Train";
import PromptNode from "./Prompt";
import { ComponentType, FunctionComponent } from "react";

export const NodeComponentMap: Record<string, FunctionComponent<AllNodeTypes>> = {
    [BlockEnum.Start]: StartNode,
    [BlockEnum.IfElse]: IfElseNode,
    [BlockEnum.Dataset]: DatasetNode,
    [BlockEnum.Model]: ModelNode,
    [BlockEnum.Train]: TrainNode,
    [BlockEnum.Prompt]: PromptNode,
  };
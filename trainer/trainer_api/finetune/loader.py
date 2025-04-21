from abc import ABC, abstractmethod
import os
from typing import Tuple, Union

import numpy as np
from trainer_api.params.model_args import ModelArguments
from trainer_api.finetune.formatter import format_dataset
from trainer_api.utils.constants import (
    DATASET_CACHE_DIR,
    FILE_EXT_MAP,
    MODEL_CACHE_DIR,
)
from transformers import AutoModelForCausalLM, PreTrainedTokenizer, AutoTokenizer

from datasets import load_dataset
from trainer_api.utils.logging_utils import get_stream_logger
from trainer_api.types.dataset import DatasetAttr, DatasetModule

logger = get_stream_logger(__name__)


class Loader(ABC):
    @abstractmethod
    def load(self):
        pass


class DatasetLoader(Loader):
    # @classmethod
    # def preprocess_dataset(cls, dataset, data_args, report_func):
    #     if dataset is None:
    #         return None

    #     preprocess_func = get_preprocess_func(
    #         data_args, stage, template, tokenizer, processor, do_generate=(training_args.predict_with_generate and is_eval)
    #     )
    #     column_names = list(next(iter(dataset)).keys())

    #     dataset = dataset.map(
    #         preprocess_func,
    #         batched=True,
    #         remove_columns=column_names,
    #         num_proc=4,
    #         load_from_cache_file=False,
    #         desc="Running tokenizer on dataset"
    #     )

    #     try:
    #         report_func("eval example:" if is_eval else "training example:")
    #         print_function(next(iter(dataset)))
    #     except StopIteration:
    #         raise RuntimeError("Cannot find valid samples, check the data format.")

    #     return dataset

    def load_one_from_hf(self, dataset_attr: DatasetAttr) -> "DatasetModule":
        data_path, data_name, data_dir, data_files = None, None, None, None

        data_path = dataset_attr.dataset_name
        data_name = dataset_attr.subset
        data_dir = dataset_attr.folder

        dataset = load_dataset(
            path=data_path,
            name=data_name,
            data_dir=data_dir,
            data_files=data_files,
            split=dataset_attr.split,
            cache_dir=DATASET_CACHE_DIR,
            streaming=False,
            trust_remote_code=True,
        )

        if dataset_attr.num_samples is not None:
            target_num = dataset_attr.num_samples
            indexes = np.random.permutation(len(dataset))[:target_num]
            target_num -= len(indexes)
            if target_num > 0:
                expand_indexes = np.random.choice(len(dataset), target_num)
                indexes = np.concatenate((indexes, expand_indexes), axis=0)

            assert len(indexes) == dataset_attr.num_samples, "Sample num mismatched."
            dataset = dataset.select(indexes)
            logger.info(
                f"Sampled {dataset_attr.num_samples} examples from dataset {dataset_attr}."
            )

        return format_dataset(dataset)

    def load(self, dataset_name):
        dataset_attr = DatasetAttr(load_from="hf_hub", dataset_name=dataset_name)
        self.load_one_from_hf(dataset_attr)


class ModelLoader(Loader):
    def __init__(self, model_name, quantization_config, device_map):
        self.model_name = model_name
        self.quantization_config = quantization_config
        self.device_map = device_map

    def _load_model(self):
        # Load base model
        model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            quantization_config=self.quantization_config,
            device_map=self.device_map,
            cache_dir=MODEL_CACHE_DIR,
            config={
                "use_cache": False,
                "pretraining_tp": 1,
            },
        )
        model.config.use_cache = False  # whether the model uses caching during inference to speed up generation by reusing previous computations
        model.config.pretraining_tp = 1
        return model

    def load(self):
        return self._load_model()


class TokenizerLoader(Loader):
    def __init__(self, arg_classes: Union["ModelArguments"]):
        self.args = arg_classes

    def load(self) -> "PreTrainedTokenizer":
        try:
            tokenizer = AutoTokenizer.from_pretrained(
                self.args.model_name_or_path,
                use_fast=self.args.use_fast_tokenizer,
                padding_side="right",
                split_special_tokens=self.args.split_special_tokens,
                cache_dir=MODEL_CACHE_DIR,
            )
        except ValueError:
            tokenizer = AutoTokenizer.from_pretrained(
                self.args.model_name_or_path,
                use_fast=True,
                padding_side="right",
                cache_dir=MODEL_CACHE_DIR,
            )

        return tokenizer

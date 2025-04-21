from abc import ABC, abstractmethod
from typing import Tuple

from trainer_api.params.data_args import DataArguments
from trainer_api.params.model_args import ModelArguments
import transformers
from transformers import HfArgumentParser, Seq2SeqTrainingArguments
from transformers.integrations import is_deepspeed_zero3_enabled
from transformers.trainer_utils import get_last_checkpoint
from transformers.training_args import ParallelMode
from transformers.utils import is_torch_bf16_gpu_available
from transformers.utils.versions import require_version


class ParamsParser(ABC):
    @abstractmethod
    def parse(self):
        pass


class TrainingParamsParser(ParamsParser, HfArgumentParser):
    def __init__(self):
        super().__init__(dataclass_types=[ModelArguments, DataArguments])

    def parse(self, model_name_or_path) -> Tuple[ModelArguments, DataArguments]:
        args_dict = {
            "model_name_or_path": model_name_or_path,
            "num_train_epochs": 1,
            "fp16": False,
            "bf16": False,
            "per_device_train_batch_size": 4,
            "per_device_eval_batch_size": 4,
            "gradient_accumulation_steps": 1,
            "gradient_checkpointing": True,
            "max_grad_norm": 0.3,
            "learning_rate": 2e-4,
            "weight_decay": 0.001,
            "optim": "paged_adamw_8bit",
            "lr_scheduler_type": "cosine",
            "max_steps": -1,
            "warmup_ratio": 0.03,
            "group_by_length": True,
            "save_steps": 0,
            "logging_steps": 25,
            "max_seq_length": 1024,
            "packing": True,
            "use_fast_tokenizer": True,
        }
        model_args, data_args = self.parse_dict(args_dict, allow_extra_keys=True)
        return (model_args, data_args)

from enum import Enum, unique
import os

"""
Scheduler scope
"""
MAX_IDLE_TIME = 5000


class WorkerStates(Enum):
    IDLE = 0
    BUSY = 1
    DONE = 2
    ERROR = 3


TRAINER_API_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../")
FINETUNE_SCRIPT_DIR = os.path.join(TRAINER_API_DIR, "finetune/")
LOG_DIR = log_path = os.path.join(TRAINER_API_DIR, "logs/")


def convert_to_enum_name(text):
    return text.upper()


BASE_MODELS = [
    "NousResearch/Llama-2-7b-chat-hf",
    "NousResearch/Meta-Llama-3-8B",
    "microsoft/Phi-3-mini-4k-instruct",
]

TRAINING_METHODS = {
    "SFT": {
        "name": "SFT",
        "full_name": "Supervised Fine-Tuning",
        "explanation": "SFT is the process of adapting a pre-trained model to a specific task using labeled data.",
        "external_link": "https://huggingface.co/docs/trl/main/en/sft_trainer",
    },
    "ORPO": {
        "name": "ORPO",
        "full_name": "Odds Ratio Preference Optimization",
        "explanation": "Odds Ratio Preference Optimization (ORPO) by Jiwoo Hong, Noah Lee, and James Thorne studies the crucial role of SFT within the context of preference alignment. "
        + "Using preference data the method posits that a minor penalty for the disfavored generation together with a strong adaption signal to the chosen response via a simple "
        + "log odds ratio term appended to the NLL loss is sufficient for preference-aligned SFT.",
        "external_link": "https://huggingface.co/docs/trl/main/en/orpo_trainer",
    },
}

EXAMPLE_DATASETS = [
    {
        "name": "mlabonne/orpo-dpo-mix-40k",
        "features": ["source", "chosen", "rejected", "prompt", "question"],
        "num_rows": 40000,
    },
    {"name": "mlabonne/guanaco-llama2-1k", "features": ["text"], "num_rows": 1000},
    {
        "name": "soulhq-ai/insuranceQA-v2",
        "features": ["input", "output"],
        "num_rows": 21300,
    },
]

"""
DATA scope
"""

FILE_EXT_MAP = {
    "csv": "csv",
    "json": "json",
    "parquet": "parquet",
    "txt": "text",
}

"""
Inference scope
"""
from peft.utils import SAFETENSORS_WEIGHTS_NAME as SAFE_ADAPTER_WEIGHTS_NAME
from peft.utils import WEIGHTS_NAME as ADAPTER_WEIGHTS_NAME
from transformers.utils import (
    SAFE_WEIGHTS_INDEX_NAME,
    SAFE_WEIGHTS_NAME,
    WEIGHTS_INDEX_NAME,
    WEIGHTS_NAME,
)

CHECKPOINT_NAMES = {
    SAFE_ADAPTER_WEIGHTS_NAME,
    ADAPTER_WEIGHTS_NAME,
    SAFE_WEIGHTS_INDEX_NAME,
    SAFE_WEIGHTS_NAME,
    WEIGHTS_INDEX_NAME,
    WEIGHTS_NAME,
}


@unique
class Role(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


"""
Finetune scope
"""
MODEL_OUTPUT_DIR = os.path.join(FINETUNE_SCRIPT_DIR, "results/")
MODEL_CACHE_DIR = os.path.join(FINETUNE_SCRIPT_DIR, "models/")
DATASET_CACHE_DIR = os.path.join(FINETUNE_SCRIPT_DIR, "datasets/")

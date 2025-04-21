import os
import torch
from transformers import LogitsProcessorList, InfNanRemoveLogitsProcessor
from transformers.utils import (
    is_torch_cuda_available,
)


class DotDict(dict):
    def __getattr__(self, key):
        try:
            return self[key]
        except KeyError:
            pass

    def __setattr__(self, key, value):
        self[key] = value

    def __delattr__(self, key):
        try:
            del self[key]
        except KeyError:
            raise AttributeError(f"'DotDict' object has no attribute '{key}'")


def check_bf16_compat(compute_dtype):
    if compute_dtype == torch.float16:
        major, _ = torch.cuda.get_device_capability()
        if major >= 8:
            print("=" * 40)
            print("GPU supports bfloat16")
            print("=" * 40)
            return True

    return False


def get_logits_processor() -> "LogitsProcessorList":
    r"""
    Gets logits processor that removes NaN and Inf logits.
    """
    logits_processor = LogitsProcessorList()
    logits_processor.append(InfNanRemoveLogitsProcessor())
    return logits_processor


def get_current_device() -> "torch.device":
    device = "cpu"
    try:
        if is_torch_cuda_available():
            device = "cuda:{}".format(os.environ.get("LOCAL_RANK", "0"))
    except:
        pass
    return torch.device(device)

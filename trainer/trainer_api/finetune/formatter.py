import os
from functools import partial
from typing import TYPE_CHECKING, Any, Dict, List, Union

from datasets import Features

from trainer_api.params.data_args import DataArguments
from trainer_api.utils.logging_utils import get_stream_logger
from trainer_api.utils.constants import Role

from datasets import Dataset, IterableDataset
from transformers import Seq2SeqTrainingArguments

from trainer_api.types.dataset import DatasetAttr


logger = get_stream_logger(__name__)


def convert_alpaca(
    examples: Dict[str, List[Any]],
    dataset_attr: "DatasetAttr",
) -> Dict[str, List[Any]]:
    r"""
    Converts alpaca format dataset to the standard format.
    """
    outputs = {"prompt": [], "response": [], "system": []}

    for i in range(len(examples[dataset_attr.prompt])):
        prompt = []
        if dataset_attr.history and isinstance(examples[dataset_attr.history][i], list):
            for old_prompt, old_response in examples[dataset_attr.history][i]:
                prompt.append({"role": Role.USER.value, "content": old_prompt})
                prompt.append({"role": Role.ASSISTANT.value, "content": old_response})

        content = []
        if dataset_attr.prompt and examples[dataset_attr.prompt][i]:
            content.append(examples[dataset_attr.prompt][i])

        if dataset_attr.query and examples[dataset_attr.query][i]:
            content.append(examples[dataset_attr.query][i])

        prompt.append(
            {"role": Role.USER.value, "content": "\n".join(content)}
        )  # "prompt\nquery"

        if dataset_attr.kto_tag and isinstance(
            examples[dataset_attr.kto_tag][i], bool
        ):  # kto example
            response = [
                {
                    "role": Role.ASSISTANT.value,
                    "content": examples[dataset_attr.response][i],
                }
            ]
            if examples[dataset_attr.kto_tag][i]:
                response = response + [{"role": Role.ASSISTANT.value, "content": ""}]
            else:
                response = [{"role": Role.ASSISTANT.value, "content": ""}] + response
        elif (
            dataset_attr.ranking
            and isinstance(examples[dataset_attr.chosen][i], str)
            and isinstance(examples[dataset_attr.rejected][i], str)
        ):  # pairwise example
            response = [
                {
                    "role": Role.ASSISTANT.value,
                    "content": examples[dataset_attr.chosen][i],
                },
                {
                    "role": Role.ASSISTANT.value,
                    "content": examples[dataset_attr.rejected][i],
                },
            ]
        elif dataset_attr.response and isinstance(
            examples[dataset_attr.response][i], str
        ):  # normal example
            response = [
                {
                    "role": Role.ASSISTANT.value,
                    "content": examples[dataset_attr.response][i],
                }
            ]
        else:  # unsupervised
            response = []

        outputs["prompt"].append(prompt)
        outputs["response"].append(response)
        outputs["system"].append(
            examples[dataset_attr.system][i] if dataset_attr.system else ""
        )

    return outputs


def format_dataset(
    dataset: Union["Dataset", "IterableDataset"],
    dataset_attr: "DatasetAttr",
) -> Union["Dataset", "IterableDataset"]:
    r"""
    Formatted dataset:
        prompt: [{"role": "user", "content": "..."}] * (2T - 1)
        response: [{"role": "assistant", "content": "..."}] * N (N > 1 for ranking dataset)
        system: "..."
    """
    if dataset_attr.formatting == "alpaca":
        convert_func = partial(convert_alpaca, dataset_attr=dataset_attr)

    column_names = list(next(iter(dataset)).keys())
    features = Features.from_dict(
        {
            "prompt": [
                {
                    "role": {"dtype": "string", "_type": "Value"},
                    "content": {"dtype": "string", "_type": "Value"},
                }
            ],
            "response": [
                {
                    "role": {"dtype": "string", "_type": "Value"},
                    "content": {"dtype": "string", "_type": "Value"},
                }
            ],
            "system": {"dtype": "string", "_type": "Value"},
        }
    )

    return dataset.map(
        convert_func,
        batched=True,
        remove_columns=column_names,
        features=features,
        num_proc=4,
        load_from_cache_file=True,
    )

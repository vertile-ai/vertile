# Copyright 2024 the LlamaFactory team.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import asyncio
import concurrent.futures
import os
from threading import Thread
from typing import (
    TYPE_CHECKING,
    Any,
    AsyncGenerator,
    Callable,
    Dict,
    List,
    Optional,
    Sequence,
    Tuple,
    Union,
)

import torch
from transformers import GenerationConfig, TextIteratorStreamer

from params import data_args, finetuning_args
from trainer_api.utils.constants import Role

from ..utils.logging_utils import get_stream_logger
from ..utils.misc import get_logits_processor
from ..model import load_model, load_tokenizer
from .base_engine import BaseEngine, Response


if TYPE_CHECKING:
    from numpy.typing import NDArray
    from transformers import PreTrainedModel, PreTrainedTokenizer, ProcessorMixin
    from transformers.image_processing_utils import BaseImageProcessor
    from trl import PreTrainedModelWrapper

    from ..params import (
        ModelArguments,
        InferenceArguments,
    )


logger = get_stream_logger(__name__)


class HuggingfaceEngine(BaseEngine):
    def __init__(
        self,
        model_args: "ModelArguments",
        inference_args: "InferenceArguments",
    ) -> None:
        self.can_generate = finetuning_args.stage == "sft"
        tokenizer_module = load_tokenizer(model_args)
        self.tokenizer = tokenizer_module["tokenizer"]
        self.processor = tokenizer_module["processor"]
        self.tokenizer.padding_side = "left" if self.can_generate else "right"
        self.model = load_model(
            self.tokenizer,
            model_args,
            finetuning_args,
            is_trainable=False,
            add_valuehead=(not self.can_generate),
        )  # must after fixing tokenizer to resize vocab
        self.inference_args = inference_args.to_dict()
        try:
            asyncio.get_event_loop()
        except RuntimeError:
            logger.warning("There is no current event loop, creating a new one.")
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        self.semaphore = asyncio.Semaphore(int(os.environ.get("MAX_CONCURRENT", "1")))

    @staticmethod
    def encode_oneturn(
        tokenizer: "PreTrainedTokenizer",
        messages: Sequence[Dict[str, str]],
        system: Optional[str] = None,
        tools: Optional[str] = None,
    ) -> Tuple[List[int], List[int]]:
        r"""
        Returns a single pair of token ids representing prompt and response respectively.
        """
        prompt_ids = []
        for encoded_ids in messages[:-1]:
            prompt_ids += encoded_ids

        answer_ids = messages[-1]
        return prompt_ids, answer_ids

    @staticmethod
    def _process_args(
        model: "PreTrainedModel",
        tokenizer: "PreTrainedTokenizer",
        processor: Optional["ProcessorMixin"],
        inference_args: Dict[str, Any],
        messages: Sequence[Dict[str, str]],
        system: Optional[str] = None,
        tools: Optional[str] = None,
        image: Optional["NDArray"] = None,
        input_kwargs: Optional[Dict[str, Any]] = {},
    ) -> Tuple[Dict[str, Any], int]:

        paired_messages = messages + [{"role": "assistant", "content": ""}]
        system = system or inference_args["default_system"]
        pixel_values = None
        prompt_ids, _ = HuggingfaceEngine.encode_oneturn(
            tokenizer=tokenizer, messages=paired_messages, system=system, tools=tools
        )

        prompt_length = len(prompt_ids)
        inputs = torch.tensor([prompt_ids], device=model.device)
        attention_mask = torch.ones_like(inputs, dtype=torch.bool)

        do_sample: Optional[bool] = input_kwargs.pop("do_sample", None)
        temperature: Optional[float] = input_kwargs.pop("temperature", None)
        top_p: Optional[float] = input_kwargs.pop("top_p", None)
        top_k: Optional[float] = input_kwargs.pop("top_k", None)
        num_return_sequences: int = input_kwargs.pop("num_return_sequences", 1)
        repetition_penalty: Optional[float] = input_kwargs.pop(
            "repetition_penalty", None
        )
        length_penalty: Optional[float] = input_kwargs.pop("length_penalty", None)
        max_length: Optional[int] = input_kwargs.pop("max_length", None)
        max_new_tokens: Optional[int] = input_kwargs.pop("max_new_tokens", None)
        stop: Optional[Union[str, List[str]]] = input_kwargs.pop("stop", None)

        if stop is not None:
            logger.warning(
                "Stop parameter is not supported by the huggingface engine yet."
            )

        inference_args = inference_args.copy()
        inference_args.update(
            dict(
                do_sample=(
                    do_sample if do_sample is not None else inference_args["do_sample"]
                ),
                temperature=(
                    temperature
                    if temperature is not None
                    else inference_args["temperature"]
                ),
                top_p=top_p if top_p is not None else inference_args["top_p"],
                top_k=top_k if top_k is not None else inference_args["top_k"],
                num_return_sequences=num_return_sequences,
                repetition_penalty=(
                    repetition_penalty
                    if repetition_penalty is not None
                    else inference_args["repetition_penalty"]
                ),
                length_penalty=(
                    length_penalty
                    if length_penalty is not None
                    else inference_args["length_penalty"]
                ),
                eos_token_id=[tokenizer.eos_token_id]
                + tokenizer.additional_special_tokens_ids,
                pad_token_id=tokenizer.pad_token_id,
            )
        )

        if (
            isinstance(num_return_sequences, int) and num_return_sequences > 1
        ):  # do_sample needs temperature > 0
            inference_args["do_sample"] = True
            inference_args["temperature"] = inference_args["temperature"] or 1.0

        if not inference_args["temperature"]:
            inference_args["do_sample"] = False

        if not inference_args["do_sample"]:
            inference_args.pop("temperature", None)
            inference_args.pop("top_p", None)

        if max_length:
            inference_args.pop("max_new_tokens", None)
            inference_args["max_length"] = max_length

        if max_new_tokens:
            inference_args.pop("max_length", None)
            inference_args["max_new_tokens"] = max_new_tokens

        gen_kwargs = dict(
            inputs=inputs,
            attention_mask=attention_mask,
            generation_config=GenerationConfig(**inference_args),
            logits_processor=get_logits_processor(),
        )

        if pixel_values is not None:
            gen_kwargs["pixel_values"] = pixel_values

        return gen_kwargs, prompt_length

    @staticmethod
    @torch.inference_mode()
    def _chat(
        model: "PreTrainedModel",
        tokenizer: "PreTrainedTokenizer",
        processor: Optional["ProcessorMixin"],
        inference_args: Dict[str, Any],
        messages: Sequence[Dict[str, str]],
        system: Optional[str] = None,
        tools: Optional[str] = None,
        image: Optional["NDArray"] = None,
        input_kwargs: Optional[Dict[str, Any]] = {},
    ) -> List["Response"]:
        gen_kwargs, prompt_length = HuggingfaceEngine._process_args(
            model,
            tokenizer,
            processor,
            inference_args,
            messages,
            system,
            tools,
            image,
            input_kwargs,
        )
        generate_output = model.generate(**gen_kwargs)
        response_ids = generate_output[:, prompt_length:]
        response = tokenizer.batch_decode(
            response_ids, skip_special_tokens=True, clean_up_tokenization_spaces=True
        )
        results = []
        for i in range(len(response)):
            eos_index = (response_ids[i] == tokenizer.eos_token_id).nonzero()
            response_length = (
                (eos_index[0].item() + 1) if len(eos_index) else len(response_ids[i])
            )
            results.append(
                Response(
                    response_text=response[i],
                    response_length=response_length,
                    prompt_length=prompt_length,
                    finish_reason="stop" if len(eos_index) else "length",
                )
            )

        return results

    @staticmethod
    @torch.inference_mode()
    def _stream_chat(
        model: "PreTrainedModel",
        tokenizer: "PreTrainedTokenizer",
        processor: Optional["ProcessorMixin"],
        inference_args: Dict[str, Any],
        messages: Sequence[Dict[str, str]],
        system: Optional[str] = None,
        tools: Optional[str] = None,
        image: Optional["NDArray"] = None,
        input_kwargs: Optional[Dict[str, Any]] = {},
    ) -> Callable[[], str]:
        gen_kwargs, _ = HuggingfaceEngine._process_args(
            model,
            tokenizer,
            processor,
            inference_args,
            messages,
            system,
            tools,
            image,
            input_kwargs,
        )
        streamer = TextIteratorStreamer(
            tokenizer, skip_prompt=True, skip_special_tokens=True
        )
        gen_kwargs["streamer"] = streamer
        thread = Thread(target=model.generate, kwargs=gen_kwargs, daemon=True)
        thread.start()

        def stream():
            try:
                return streamer.__next__()
            except StopIteration:
                raise StopAsyncIteration()

        return stream

    @staticmethod
    @torch.inference_mode()
    def _get_scores(
        model: "PreTrainedModelWrapper",
        tokenizer: "PreTrainedTokenizer",
        batch_input: List[str],
        input_kwargs: Optional[Dict[str, Any]] = {},
    ) -> List[float]:
        max_length = input_kwargs.pop("max_length", None)
        device = getattr(model.pretrained_model, "device", "cuda")
        inputs = tokenizer(
            batch_input,
            padding=True,
            truncation=True,
            max_length=max_length
            or getattr(model.config, "max_position_embeddings", 1024),
            return_tensors="pt",
            add_special_tokens=True,
        ).to(device)

        input_ids: torch.Tensor = inputs["input_ids"]
        _, _, values = model(**inputs, output_hidden_states=True, return_dict=True)

        if getattr(model.config, "model_type", None) == "chatglm":
            values = torch.transpose(values, 0, 1)

        scores = []
        for i in range(input_ids.size(0)):
            end_indexes = (input_ids[i] != tokenizer.pad_token_id).nonzero()
            end_index = end_indexes[-1].item() if len(end_indexes) else 0
            scores.append(values[i, end_index].nan_to_num().item())

        return scores

    async def chat(
        self,
        messages: Sequence[Dict[str, str]],
        system: Optional[str] = None,
        tools: Optional[str] = None,
        image: Optional["NDArray"] = None,
        **input_kwargs,
    ) -> List["Response"]:
        if not self.can_generate:
            raise ValueError("The current model does not support `chat`.")

        loop = asyncio.get_running_loop()
        input_args = (
            self.model,
            self.tokenizer,
            self.processor,
            self.template,
            self.inference_args,
            messages,
            system,
            tools,
            image,
            input_kwargs,
        )
        async with self.semaphore:
            with concurrent.futures.ThreadPoolExecutor() as pool:
                return await loop.run_in_executor(pool, self._chat, *input_args)

    async def stream_chat(
        self,
        messages: Sequence[Dict[str, str]],
        system: Optional[str] = None,
        tools: Optional[str] = None,
        image: Optional["NDArray"] = None,
        **input_kwargs,
    ) -> AsyncGenerator[str, None]:
        if not self.can_generate:
            raise ValueError("The current model does not support `stream_chat`.")

        loop = asyncio.get_running_loop()
        input_args = (
            self.model,
            self.tokenizer,
            self.processor,
            self.template,
            self.inference_args,
            messages,
            system,
            tools,
            image,
            input_kwargs,
        )
        async with self.semaphore:
            with concurrent.futures.ThreadPoolExecutor() as pool:
                stream = self._stream_chat(*input_args)
                while True:
                    try:
                        yield await loop.run_in_executor(pool, stream)
                    except StopAsyncIteration:
                        break

    async def get_scores(
        self,
        batch_input: List[str],
        **input_kwargs,
    ) -> List[float]:
        if self.can_generate:
            raise ValueError("Cannot get scores using an auto-regressive model.")

        loop = asyncio.get_running_loop()
        input_args = (self.model, self.tokenizer, batch_input, input_kwargs)
        async with self.semaphore:
            with concurrent.futures.ThreadPoolExecutor() as pool:
                return await loop.run_in_executor(pool, self._get_scores, *input_args)

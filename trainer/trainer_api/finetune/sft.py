import contextlib
from datetime import datetime
import json
import os
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    PreTrainedTokenizer,
)

from trl import SFTTrainer, SFTConfig, ORPOConfig, ORPOTrainer
from datasets import load_dataset
from peft import LoraConfig, PeftModel

from peft.utils import TaskType

from trainer_api.reporter.reporter import TrainerReporter
from trainer_api.utils.memory import estimate_command

from .parser import TrainingParamsParser
from trainer_api.utils.logging_utils import StdoutInterceptor

from .loader import ModelLoader, TokenizerLoader
from trainer_api.utils.misc import (
    DotDict,
    get_current_device,
)
from trainer_api.utils.constants import (
    MODEL_OUTPUT_DIR,
    DATASET_CACHE_DIR,
)


# Number of training epochs
num_train_epochs = 1

# Enable fp16/bf16 training (set bf16 to True with an A100)
fp16 = False
bf16 = False

# Batch size per GPU for training
per_device_train_batch_size = 4

# Batch size per GPU for evaluation
per_device_eval_batch_size = 4

# Number of update steps to accumulate the gradients for
gradient_accumulation_steps = 1

# Enable gradient checkpointing
gradient_checkpointing = True

# Maximum gradient normal (gradient clipping)
max_grad_norm = 0.3

# Initial learning rate (AdamW optimizer)
learning_rate = 2e-4

# Weight decay to apply to all layers except bias/LayerNorm weights
weight_decay = 0.001

# Optimizer to use
optim = "paged_adamw_8bit"

# Learning rate schedule
lr_scheduler_type = "cosine"

# Number of training steps (overrides num_train_epochs)
max_steps = -1

# Ratio of steps for a linear warmup (from 0 to learning rate)
warmup_ratio = 0.03

# Group sequences into batches with same length
# Saves memory and speeds up training considerably
group_by_length = True

# Save checkpoint every X updates steps
save_steps = 0

# Log every X updates steps
logging_steps = 25

################################################################################
# SFT parameters
################################################################################

# Maximum sequence length to use
max_seq_length = 1024

# Pack multiple short examples in the same input sequence to increase efficiency
packing = False


device_map = get_current_device()


def get_dataset(name, split=None, cache_dir=DATASET_CACHE_DIR):
    return load_dataset(name, split=split, cache_dir=cache_dir)


def get_lora_config(
    lora_alpha,
    lora_dropout,
    lora_rank: int = 16,
):
    return LoraConfig(
        lora_alpha=lora_alpha if lora_alpha is not None else lora_rank * 2,
        lora_dropout=lora_dropout,
        r=lora_rank,
        task_type=TaskType.CAUSAL_LM,
    )


def get_bnb_config():
    ################################################################################
    # bitsandbytes parameters
    ################################################################################

    # Activate 4-bit precision base model loading
    use_4bit = True

    # Compute dtype for 4-bit base models
    bnb_4bit_compute_dtype = "float16"

    # Quantization type (fp4 or nf4)
    bnb_4bit_quant_type = "nf4"

    # Activate nested quantization for 4-bit base models (double quantization)
    use_nested_quant = False

    # Load tokenizer and model with QLoRA configuration
    compute_dtype = getattr(torch, bnb_4bit_compute_dtype)

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=use_4bit,
        bnb_4bit_quant_type=bnb_4bit_quant_type,
        bnb_4bit_compute_dtype=compute_dtype,
        bnb_4bit_use_double_quant=use_nested_quant,
    )

    return bnb_config


def get_new_model_name():
    now = datetime.now()
    formatted_datetime = now.strftime("%Y-%m-%d-%H-%M-%S")
    return formatted_datetime


##########################
## Validate GPU Limit ####
##########################


def get_model_parameters(model):
    # Extract model architecture parameters
    num_parameters = sum(
        p.numel() for p in model.parameters()
    )  # Total number of parameters
    batch_size = 1  # Batch size is typically 1 during model loading
    seq_length = 128  # Default sequence length used during model loading
    hidden_size = model.config.hidden_size  # Hidden size of the model
    num_layers = model.config.num_hidden_layers  # Number of layers in the model

    return {
        "num_parameters": num_parameters,
        "batch_size": batch_size,
        "seq_length": seq_length,
        "hidden_size": hidden_size,
        "num_layers": num_layers,
    }


def get_trainer(
    model,
    train_dataset,
    peft_config,
    tokenizer,
    method,
):
    if method.lower() == "sft":
        k, v = next(iter(train_dataset.features.items()))
        training_arguments = SFTConfig(
            output_dir=MODEL_OUTPUT_DIR,
            max_seq_length=max_seq_length,
            dataset_text_field=k,
            num_train_epochs=num_train_epochs,
            gradient_accumulation_steps=gradient_accumulation_steps,
            optim="paged_adamw_8bit",
            save_steps=0,
            logging_steps=logging_steps,
            learning_rate=learning_rate,
            weight_decay=weight_decay,
            fp16=fp16,
            bf16=bf16,
            max_grad_norm=max_grad_norm,
            max_steps=max_steps,
            warmup_ratio=warmup_ratio,
            group_by_length=group_by_length,
            lr_scheduler_type=lr_scheduler_type,
        )
        trainer = SFTTrainer(
            model=model,
            train_dataset=train_dataset,
            peft_config=peft_config,
            tokenizer=tokenizer,
            args=training_arguments,
        )
        return trainer

    elif method.lower() == "orpo":
        training_arguments = ORPOConfig(
            learning_rate=learning_rate,
            beta=0.1,
            lr_scheduler_type="linear",
            max_length=1024,
            max_prompt_length=512,
            per_device_train_batch_size=per_device_train_batch_size,
            per_device_eval_batch_size=per_device_eval_batch_size,
            gradient_accumulation_steps=4,
            optim=optim,
            num_train_epochs=num_train_epochs,
            eval_strategy="steps",
            eval_steps=0.2,
            logging_steps=1,
            warmup_steps=10,
            output_dir=MODEL_OUTPUT_DIR,
            remove_unused_columns=False,
        )
        trainer = ORPOTrainer(
            model=model,
            args=training_arguments,
            train_dataset=train_dataset,
            peft_config=peft_config,
            tokenizer=tokenizer,
        )
        return trainer


class SFTRunner:
    def __init__(self, task_id, reporter):
        self.id = task_id
        self.reporter: TrainerReporter = reporter

    def report(self, log):
        print(log)
        if not self.reporter:
            return
        self.reporter.report(log)

    def get_gpu_memory(self):
        print(device_map.type)
        if not device_map.type.startswith("cuda"):
            return 0, 0
        if not torch.cuda.is_available():
            return -1, -1

        total_memory = torch.cuda.get_device_properties(0).total_memory
        free_memory = torch.cuda.memory_reserved(0)

        return total_memory, free_memory

    def validate_dataset(self, dataset, method, dataset_name):
        if not dataset:
            self.report(
                {
                    "type": "warning",
                    "message": f"[Warning] the dataset {dataset_name} has no train split",
                }
            )
            return False

        if (
            method == "orpo"
            and dataset.features is not None
            and "prompt" not in dataset.features
            and "chosen" not in dataset.features
            and "rejected" not in dataset.features
        ):
            self.report(
                {
                    "type": "warning",
                    "message": f"[Warning] the dataset {dataset_name} is not suitable for the chosen method {method.upper()}",
                }
            )
            return False

        if (
            method == "sft"
            and isinstance(dataset.features, list)
            and len(dataset.features) != 1
        ):
            self.report(
                {
                    "type": "warning",
                    "message": f"[Warning] the dataset {dataset_name} is not suitable for the chosen method {method.upper()}",
                }
            )
            return False
        return True

    def run(self, model_name, method, dataset_name, hparams):
        self.report({"type": "title", "message": "Validating options"})

        if not method:
            self.report(
                {
                    "type": "warning",
                    "message": "No training method provided, exiting",
                }
            )
            return
        self.report({"type": "detail", "message": f"Training method： {method}"})

        if not model_name:
            self.report({"type": "warning", "message": "No model provided, exiting"})
            return
        self.report({"detail": f"**Base model** {model_name}"})

        if not dataset_name:
            self.report({"type": "warning", "message": "No dataset provided, exiting"})
            return
        self.report({"type": "detail", "message": f"Selected dataset {dataset_name}"})
        self.report({"type": "info", "message": "Validationg success"})

        self.report(
            {
                "type": "title",
                "message": f"Checking hardware requirements",
            }
        )
        total_memory, free_memory = self.get_gpu_memory()
        self.report(
            {
                "type": "info",
                "message": f"Free Memory {free_memory} / Total Memory {total_memory}",
            }
        )
        if total_memory == 0:
            self.report(
                {"type": "info", "message": f"CUDA is not available. Finishing"}
            )
            return

        if total_memory < 0:
            self.report({"type": "info", "message": f"No GPU detected. Finishing"})
            self.report({"type": "info", "message": f"Job is finished"})
            return

        interceptor = StdoutInterceptor(logger_name=__name__)
        estimate_args = DotDict(
            {
                "model_name": model_name,
                "dtypes": ["float16", "int8", "int4"],
            }
        )
        with contextlib.redirect_stdout(interceptor):
            estimated_result = estimate_command(estimate_args)
            print(estimated_result)
            self.report({"type": "info", "message": estimated_result})
        intercepted_output = interceptor.get_value()

        trainable = True
        # if estimated_training_memory_usage["total_memory"] > free_memory:
        #     self.report(
        #         json.dumps(
        #             {
        #                 "type": "warning",
        #                 "message": f"Estimated: require at least {estimated_training_memory_usage['total_memory'] // 1e6} MB, but only have {free_memory//1e6} MB left.\n Unable to start model training.",
        #             }
        #         )
        #     )
        #     trainable = False
        # else:
        #     self.report(
        #         json.dumps(
        #             {
        #                 "type": "info",
        #                 "message": f"Memory check finished. The model is trainable on current device",
        #             }
        #         )
        #     )

        if not trainable:
            return

        everything_parser = TrainingParamsParser()
        model_args, data_args = everything_parser.parse(model_name)
        self.report(
            {
                "type": "title",
                "message": f"Loading model params",
            }
        )
        bnb_config = get_bnb_config()
        model_loader = ModelLoader(model_name, bnb_config, device_map)
        model = model_loader.load()
        tokenizer_loader = TokenizerLoader(model_args)
        tokenizer = tokenizer_loader.load()
        self.report(
            {
                "type": "detail",
                "message": f"Loading dataset {dataset_name}",
            }
        )

        train_dataset = get_dataset(
            name=dataset_name, split="train", cache_dir=DATASET_CACHE_DIR
        )
        if not self.validate_dataset(
            train_dataset, method=method, dataset_name=dataset_name
        ):
            return

        lora_rank = 64
        lora_alpha = 16
        lora_dropout = 0.1
        self.report(
            {
                "type": "detail",
                "message": f"Loading LORA configuration:\n 'lora_alpha': {lora_alpha}\n 'lora_dropout': {lora_dropout}\n 'lora_rank': {lora_rank}\n",
            }
        )

        peft_config = get_lora_config(
            lora_alpha=lora_alpha, lora_dropout=lora_dropout, lora_rank=lora_rank
        )

        self.report(
            {
                "type": "title",
                "message": f"Preparing trainer\n",
            }
        )

        trainer = get_trainer(
            model=model,
            train_dataset=train_dataset,
            peft_config=peft_config,
            tokenizer=tokenizer,
            method=method,
        )

        self.report(
            {
                "type": "detail",
                "message": f"Trainer is loaded for\n\n Model: {model_name}\n\n Dataset: {dataset_name}",
            }
        )

        # Fine-tuned model name
        new_model = get_new_model_name()
        save_directory = os.path.join(MODEL_OUTPUT_DIR, new_model)

        # Train model
        trainer.train()

        kwargs = {
            "finetuned_from": model_name,
            "dataset": list(data_args.dataset_mixer.keys()),
            "dataset_tags": list(data_args.dataset_mixer.keys()),
            "tags": ["aimo"],
        }
        # Save trained model
        trainer.save_model()
        saved_tokenizer = tokenizer.save_pretrained(save_directory)
        trainer.push_to_hub()
        del model
        del trainer
        torch.cuda.empty_cache()

        # base_model = AutoModelForCausalLM.from_pretrained(
        #     model_name,
        #     low_cpu_mem_usage=True,
        #     return_dict=True,
        #     torch_dtype=torch.float16,
        #     device_map=device_map,
        # )
        # model = PeftModel.from_pretrained(base_model, new_model)
        # model = model.merge_and_unload()
        # saved_tokenizer = tokenizer.save_pretrained(new_model)

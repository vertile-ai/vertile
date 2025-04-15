import uuid
from django.test import TestCase
from trainer_api.finetune.sft import SFTRunner


class SFTRunnerTestCase(TestCase):
    def test_sft_runner_execution(self):
        model = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
        method = "sft"
        dataset = "soulhq-ai/insuranceQA-v2"

        runner_id = uuid.uuid4()
        runner = SFTRunner(runner_id, None)
        result = runner.run(model, method, dataset, None)
        print(result)

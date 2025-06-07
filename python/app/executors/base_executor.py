from abc import ABC, abstractmethod
from typing import Dict, Any


class BaseExecutor(ABC):
    @abstractmethod
    def execute(self, node: Dict, previous_results: Dict, workflow_id: str) -> Dict:
        pass

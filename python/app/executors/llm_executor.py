import asyncio
import logging
import os
from typing import Dict, Any, Optional, List
from enum import Enum

from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.llms import Ollama
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.executors.base_executor import BaseExecutor
from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMProvider(Enum):
    """Supported LLM providers"""

    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    OLLAMA = "ollama"
    AZURE_OPENAI = "azure_openai"


class LLMExecutor(BaseExecutor):
    """
    LLM Executor that supports multiple LLM providers using langchain.
    """

    def __init__(self):
        self.llm_instances: Dict[str, Any] = {}
        self.output_parser = StrOutputParser()

    def _get_llm_instance(self, provider: str, model: str, **kwargs) -> Any:
        """Get or create an LLM instance based on provider and model."""
        cache_key = f"{provider}:{model}"

        if cache_key in self.llm_instances:
            return self.llm_instances[cache_key]

        try:
            if provider == LLMProvider.OPENAI.value:
                llm = ChatOpenAI(
                    model=model,
                    temperature=kwargs.get("temperature", 0.7),
                    max_tokens=kwargs.get("max_tokens", 10000),
                    api_key=kwargs.get("api_key"),
                )
            elif provider == LLMProvider.ANTHROPIC.value:
                llm = ChatAnthropic(
                    model=model,
                    temperature=kwargs.get("temperature", 0.7),
                    max_tokens=kwargs.get("max_tokens", 1000),
                    api_key=kwargs.get("api_key"),
                )
            elif provider == LLMProvider.GOOGLE.value:
                llm = ChatGoogleGenerativeAI(
                    model=model,
                    temperature=kwargs.get("temperature", 0.7),
                    max_output_tokens=kwargs.get("max_tokens", 1000),
                    google_api_key=kwargs.get("api_key"),
                )
            elif provider == LLMProvider.OLLAMA.value:
                llm = Ollama(
                    model=model,
                    temperature=kwargs.get("temperature", 0.7),
                    base_url=kwargs.get("base_url", "http://localhost:11434"),
                )
            elif provider == LLMProvider.AZURE_OPENAI.value:
                llm = ChatOpenAI(
                    model=model,
                    temperature=kwargs.get("temperature", 0.7),
                    max_tokens=kwargs.get("max_tokens", 1000),
                    azure_endpoint=kwargs.get("azure_endpoint"),
                    api_key=kwargs.get("api_key"),
                    api_version=kwargs.get("api_version", "2024-02-15-preview"),
                )
            else:
                raise ValueError(f"Unsupported LLM provider: {provider}")

            # Cache the instance
            self.llm_instances[cache_key] = llm
            return llm

        except Exception as e:
            logger.error(
                f"Failed to create LLM instance for {provider}:{model}: {str(e)}"
            )
            raise

    def _create_prompt_template(self, template_type: str, template_content: str) -> Any:
        """Create a prompt template based on type."""
        if template_type == "chat":
            return ChatPromptTemplate.from_template(template_content)
        elif template_type == "simple":
            return PromptTemplate.from_template(template_content)
        else:
            # Default to chat template
            return ChatPromptTemplate.from_template(template_content)

    def _format_messages(self, messages: List[Dict[str, str]]) -> List[Any]:
        """Format messages for langchain."""
        formatted_messages = []

        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")

            if role == "system":
                formatted_messages.append(SystemMessage(content=content))
            elif role == "user":
                formatted_messages.append(HumanMessage(content=content))
            elif role == "assistant":
                formatted_messages.append(AIMessage(content=content))
            else:
                # Default to human message
                formatted_messages.append(HumanMessage(content=content))

        return formatted_messages

    async def execute(self, node: Dict) -> Dict:
        """
        Execute LLM node with the specified configuration.

        Expected node data structure:
        {
            "id": "node_id",
            "data": {
                "type": "llm",
                "config": {
                    "provider": "openai",  # openai, anthropic, google, ollama, azure_openai
                    "model": "gpt-3.5-turbo",
                    "temperature": 0.7,
                    "max_tokens": 1000,
                    "messages": [
                        {"role": "system", "content": "You are a helpful assistant"},
                        {"role": "user", "content": "Hello!"}
                    ],
                }
            }
        }
        """
        node_id = node["id"]
        config = node.get("data", {}).get("config", {})

        # Extract configuration
        provider = config.get("provider", "openai")
        model = config.get("model", "gpt-3.5-turbo")
        temperature = config.get("temperature", 0.7)
        max_tokens = config.get("max_tokens", 1000)
        api_key = config.get("api_key") or settings.OPENAI_API_KEY
        messages = config.get("messages", [])

        logger.info(
            f"Executing LLM node {node_id} with provider {provider} and model {model}"
        )

        try:
            # Validate configuration first
            if not messages:
                raise ValueError(
                    "Either 'messages' or 'prompt_template' must be provided"
                )

            # Get LLM instance
            # Filter out keys that are already passed explicitly to avoid conflicts
            additional_config = {
                k: v
                for k, v in config.items()
                if k
                not in [
                    "provider",
                    "model",
                    "temperature",
                    "max_tokens",
                    "api_key",
                    "messages",
                ]
            }

            llm = self._get_llm_instance(
                provider=provider,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                api_key=api_key,
                **additional_config,  # Pass any additional config
            )

            # Create and execute chain
            start_time = asyncio.get_event_loop().time()

            # Use messages format
            formatted_messages = self._format_messages(messages)
            response = await llm.ainvoke(formatted_messages)

            execution_time = asyncio.get_event_loop().time() - start_time

            # Format response
            if hasattr(response, "content"):
                response_text = response.content
            else:
                response_text = str(response)

            result = {
                "node_id": node_id,
                "type": "llm",
                "status": "success",
                "execution_time": execution_time,
                "result": f"LLM processing completed for node {node_id}",
                "output": {
                    "response": response_text,
                    "provider": provider,
                    "model": model,
                    "metadata": {
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                        "execution_time": execution_time,
                    },
                },
            }

            logger.info(
                f"LLM node {node_id} completed successfully in {execution_time:.2f}s"
            )
            return result

        except Exception as e:
            logger.error(f"Error executing LLM node {node_id}: {str(e)}")
            return {
                "node_id": node_id,
                "type": "llm",
                "status": "error",
                "execution_time": 0.0,
                "result": f"Error executing LLM node: {str(e)}",
                "error": str(e),
                "output": {
                    "provider": provider,
                    "model": model,
                    "error_details": str(e),
                },
            }

    def clear_cache(self):
        """Clear the LLM instance cache."""
        self.llm_instances.clear()
        logger.info("LLM instance cache cleared")

    def get_supported_providers(self) -> List[str]:
        """Get list of supported LLM providers."""
        return [provider.value for provider in LLMProvider]

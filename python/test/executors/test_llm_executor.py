"""
Tests for LLMExecutor service.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.executors.llm_executor import LLMExecutor


class TestLLMExecutor:
    """Test cases for LLMExecutor class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.executor = LLMExecutor()

    def _create_mock_response(self, content: str):
        """Create a mock response object."""
        mock_response = MagicMock()
        mock_response.content = content
        return mock_response

    @pytest.mark.asyncio
    @patch("app.executors.llm_executor.ChatOpenAI")
    async def test_execute_openai_simple_message(self, mock_openai):
        """Test LLM execution with OpenAI using simple message format."""

        # Setup mock
        mock_llm = AsyncMock()
        mock_llm.ainvoke.return_value = self._create_mock_response("4")
        mock_openai.return_value = mock_llm

        node = {
            "id": "test_llm_node_1",
            "data": {
                "type": "llm",
                "config": {
                    "provider": "openai",
                    "model": "gpt-3.5-turbo",
                    "temperature": 0.1,  # Low temperature for consistent results
                    "max_tokens": 100,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a helpful assistant. Answer briefly.",
                        },
                        {
                            "role": "user",
                            "content": "What is 2+2? Answer with just the number.",
                        },
                    ],
                },
            },
        }

        result = await self.executor.execute(node)

        # Verify result structure
        assert result["node_id"] == "test_llm_node_1"
        assert result["type"] == "llm"
        assert result["status"] == "success"
        assert "execution_time" in result
        assert result["execution_time"] >= 0

        # Verify output structure
        assert "output" in result
        assert "response" in result["output"]
        assert "provider" in result["output"]
        assert result["output"]["provider"] == "openai"
        assert result["output"]["model"] == "gpt-3.5-turbo"

        # Verify response contains the answer
        response_text = result["output"]["response"]
        assert response_text is not None
        assert len(response_text.strip()) > 0
        # The response should contain "4" for 2+2
        assert "4" in response_text

    @pytest.mark.asyncio
    @patch("app.executors.llm_executor.ChatOpenAI")
    async def test_execute_openai_conversation(self, mock_openai):
        """Test LLM execution with OpenAI using conversation format."""

        # Setup mock
        mock_llm = AsyncMock()
        mock_llm.ainvoke.return_value = self._create_mock_response(
            "def add(a, b):\n    return a + b"
        )
        mock_openai.return_value = mock_llm

        node = {
            "id": "test_llm_node_2",
            "data": {
                "type": "llm",
                "config": {
                    "provider": "openai",
                    "model": "gpt-3.5-turbo",
                    "temperature": 0.2,
                    "max_tokens": 200,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a programming assistant.",
                        },
                        {
                            "role": "user",
                            "content": "Write a simple Python function to add two numbers. Keep it very short.",
                        },
                    ],
                },
            },
        }

        result = await self.executor.execute(node)

        # Verify result structure
        assert result["node_id"] == "test_llm_node_2"
        assert result["type"] == "llm"
        assert result["status"] == "success"
        assert "execution_time" in result

        # Verify output contains code
        response_text = result["output"]["response"]
        assert "def" in response_text.lower()  # Should contain function definition
        assert "+" in response_text or "add" in response_text.lower()

    @pytest.mark.asyncio
    @patch("app.executors.llm_executor.ChatOpenAI")
    async def test_execute_openai_with_different_model(self, mock_openai):
        """Test LLM execution with OpenAI using gpt-4 model."""

        # Setup mock
        mock_llm = AsyncMock()
        mock_llm.ainvoke.return_value = self._create_mock_response("Hello OpenAI")
        mock_openai.return_value = mock_llm

        node = {
            "id": "test_llm_node_3",
            "data": {
                "type": "llm",
                "config": {
                    "provider": "openai",
                    "model": "gpt-4",
                    "temperature": 0.1,
                    "max_tokens": 50,
                    "messages": [
                        {
                            "role": "user",
                            "content": "Say 'Hello OpenAI' and nothing else.",
                        }
                    ],
                },
            },
        }

        result = await self.executor.execute(node)

        # Verify result structure
        assert result["node_id"] == "test_llm_node_3"
        assert result["type"] == "llm"
        assert result["status"] == "success"
        assert result["output"]["model"] == "gpt-4"

        # Verify response
        response_text = result["output"]["response"]
        assert "hello" in response_text.lower()
        assert "openai" in response_text.lower()

    @pytest.mark.asyncio
    @patch("app.executors.llm_executor.ChatOpenAI")
    async def test_execute_with_custom_temperature_and_tokens(self, mock_openai):
        """Test LLM execution with custom temperature and max_tokens."""

        # Setup mock
        mock_llm = AsyncMock()
        mock_llm.ainvoke.return_value = self._create_mock_response(
            "Once upon a time, there was a friendly robot named Beep."
        )
        mock_openai.return_value = mock_llm

        node = {
            "id": "test_llm_node_4",
            "data": {
                "type": "llm",
                "config": {
                    "provider": "openai",
                    "model": "gpt-3.5-turbo",
                    "temperature": 0.9,  # High temperature for creative responses
                    "max_tokens": 50,
                    "messages": [
                        {
                            "role": "user",
                            "content": "Tell me a very short creative story about a robot.",
                        }
                    ],
                },
            },
        }

        result = await self.executor.execute(node)

        # Verify result structure
        assert result["node_id"] == "test_llm_node_4"
        assert result["status"] == "success"

        # Verify metadata contains our settings
        metadata = result["output"]["metadata"]
        assert metadata["temperature"] == 0.9
        assert metadata["max_tokens"] == 50

        # Verify response is not empty
        response_text = result["output"]["response"]
        assert len(response_text.strip()) > 0

    @pytest.mark.asyncio
    async def test_execute_with_missing_config(self):
        """Test LLM execution with missing configuration raises appropriate error."""

        node = {
            "id": "test_llm_node_5",
            "data": {
                "type": "llm",
                "config": {
                    "provider": "openai",
                    "model": "gpt-3.5-turbo",
                    # Missing messages
                },
            },
        }

        result = await self.executor.execute(node)

        # Should return error result
        assert result["node_id"] == "test_llm_node_5"
        assert result["status"] == "error"
        assert "error" in result
        assert (
            "messages" in result["error"].lower()
            or "prompt_template" in result["error"].lower()
        )

    @pytest.mark.asyncio
    async def test_execute_with_invalid_provider(self):
        """Test LLM execution with invalid provider raises appropriate error."""

        node = {
            "id": "test_llm_node_6",
            "data": {
                "type": "llm",
                "config": {
                    "provider": "invalid_provider",
                    "model": "some-model",
                    "messages": [{"role": "user", "content": "Hello"}],
                },
            },
        }

        result = await self.executor.execute(node)

        # Should return error result
        assert result["node_id"] == "test_llm_node_6"
        assert result["status"] == "error"
        assert "error" in result
        assert (
            "unsupported" in result["error"].lower()
            or "invalid" in result["error"].lower()
        )

    @pytest.mark.asyncio
    @patch("app.executors.llm_executor.ChatOpenAI")
    async def test_execute_system_and_user_messages(self, mock_openai):
        """Test LLM execution with both system and user messages."""

        # Setup mock
        mock_llm = AsyncMock()
        mock_llm.ainvoke.return_value = self._create_mock_response(
            "15 * 8 = 120. To calculate this, I multiply 15 by 8."
        )
        mock_openai.return_value = mock_llm

        node = {
            "id": "test_llm_node_7",
            "data": {
                "type": "llm",
                "config": {
                    "provider": "openai",
                    "model": "gpt-3.5-turbo",
                    "temperature": 0.1,
                    "max_tokens": 100,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a math teacher. Always explain your reasoning.",
                        },
                        {"role": "user", "content": "What is 15 * 8?"},
                    ],
                },
            },
        }

        result = await self.executor.execute(node)

        # Verify result structure
        assert result["status"] == "success"

        # Should contain the answer and some explanation
        response_text = result["output"]["response"]
        assert "120" in response_text  # 15 * 8 = 120
        # Should contain some explanation due to system message
        assert len(response_text) > 10  # More than just the number

    @pytest.mark.asyncio
    @patch("app.executors.llm_executor.ChatOpenAI")
    async def test_executor_instance_caching(self, mock_openai):
        """Test that LLM instances are cached properly."""

        # Setup mock
        mock_llm = AsyncMock()
        mock_llm.ainvoke.return_value = self._create_mock_response("Hello")
        mock_openai.return_value = mock_llm

        # Create two identical configurations
        node1 = {
            "id": "test_llm_node_8a",
            "data": {
                "type": "llm",
                "config": {
                    "provider": "openai",
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": "Hello"}],
                },
            },
        }

        node2 = {
            "id": "test_llm_node_8b",
            "data": {
                "type": "llm",
                "config": {
                    "provider": "openai",
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": "Hi there"}],
                },
            },
        }

        # Execute both nodes
        result1 = await self.executor.execute(node1)
        result2 = await self.executor.execute(node2)

        # Both should succeed
        assert result1["status"] == "success"
        assert result2["status"] == "success"

        # Check that cache contains the instance
        cache_key = "openai:gpt-3.5-turbo"
        assert cache_key in self.executor.llm_instances

    @pytest.mark.asyncio
    @patch("app.executors.llm_executor.ChatOpenAI")
    async def test_clear_cache(self, mock_openai):
        """Test clearing the LLM instance cache."""

        # Setup mock
        mock_llm = AsyncMock()
        mock_llm.ainvoke.return_value = self._create_mock_response("Test")
        mock_openai.return_value = mock_llm

        # First execute something to populate cache
        node = {
            "id": "test_llm_node_9",
            "data": {
                "type": "llm",
                "config": {
                    "provider": "openai",
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": "Test"}],
                },
            },
        }

        await self.executor.execute(node)

        # Verify cache has content
        assert len(self.executor.llm_instances) > 0

        # Clear cache
        self.executor.clear_cache()

        # Verify cache is empty
        assert len(self.executor.llm_instances) == 0

    def test_get_supported_providers(self):
        """Test getting list of supported LLM providers."""
        providers = self.executor.get_supported_providers()

        # Should contain all expected providers
        expected_providers = ["openai", "anthropic", "google", "ollama", "azure_openai"]
        assert isinstance(providers, list)

        for provider in expected_providers:
            assert provider in providers

    def teardown_method(self):
        """Clean up after each test."""
        # Clear cache after each test
        if hasattr(self, "executor"):
            self.executor.clear_cache()

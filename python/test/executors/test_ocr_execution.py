"""
Tests for OCRExecution service.
"""

import os
import asyncio
from datetime import datetime
from unittest.mock import patch, MagicMock
import pytest
from PIL import Image

from python.app.executors.ocr_execution import OCRExecutor


@pytest.fixture
def easy_clear_image_file():
    """Return the path to the easy_clear.png fixture image."""
    # Use the fixture path directly
    return "__fixtures__/image/easy_clear.png"


@pytest.fixture
def mock_recognition_result():
    """Mock Surya OCR recognition result."""
    mock_result = MagicMock()
    mock_result.text = "Sample OCR text"

    # Create mock blocks
    block1 = MagicMock()
    block1.text = "Block 1"
    block1.confidence = 0.95
    block1.bbox = [10, 10, 50, 50]

    block2 = MagicMock()
    block2.text = "Block 2"
    block2.confidence = 0.85
    block2.bbox = [60, 60, 90, 90]

    mock_result.blocks = [block1, block2]

    return [mock_result]


class TestOCRExecution:
    """Test cases for OCRExecution class."""

    async def _wait_for_ocr_job(self, job_id, timeout=10):
        """Helper method to wait for an OCR job to complete.

        Args:
            job_id: The job ID to wait for
            timeout: Maximum time to wait in seconds

        Returns:
            The job info dictionary if job completed or failed,
            None if timed out
        """
        poll_interval = 0.5
        waited = 0

        while waited < timeout:
            await asyncio.sleep(poll_interval)
            waited += poll_interval

            job_info = OCRExecution.get_job(job_id)
            if job_info["status"] in ["completed", "failed"]:
                return job_info

        return OCRExecution.get_job(job_id)  # Return current state even if not complete
        """Test successful OCR execution."""

        # Create OCR execution instance
        ocr = OCRExecution(file_path=sample_image_file)

        # Mock the Surya OCR process
        with (
            patch(
                "app.services.ocr_execution.RecognitionPredictor"
            ) as MockRecPredictor,
            patch("app.services.ocr_execution.DetectionPredictor") as MockDetPredictor,
        ):

            # Set up the mock to return our test result
            mock_rec_instance = MockRecPredictor.return_value
            mock_rec_instance.return_value = mock_recognition_result

            # Execute OCR job
            job_id = await ocr.execute()

            # Wait for job to complete
            job_info = await self._wait_for_ocr_job(job_id)

            # Get job info and verify
            assert job_info["status"] == "completed"
            assert "result" in job_info
            assert job_info["result"]["text"] == "Sample OCR text"
            assert len(job_info["result"]["blocks"]) == 2

    @pytest.mark.asyncio
    async def test_execute_file_not_found(self):
        """Test OCR execution with non-existent file."""
        # Create OCR execution with non-existent file
        ocr = OCRExecution(file_path="__fixtures__/non_existent_file.png")

        # Execute OCR job
        job_id = await ocr.execute()

        # Wait for job to complete
        job_info = await self._wait_for_ocr_job(job_id)

        # Get job info and verify failure
        assert job_info["status"] == "failed"
        assert "error" in job_info
        assert "File not found" in job_info["error"]

    @pytest.mark.asyncio
    async def test_execute_with_real_image(
        self, easy_clear_image_file, mock_recognition_result
    ):
        """Test OCR execution with the easy_clear.png fixture image."""
        # Create OCR execution instance with real image file
        ocr = OCRExecution(file_path=easy_clear_image_file)

        # Mock the Surya OCR process
        with (
            patch(
                "app.services.ocr_execution.RecognitionPredictor"
            ) as MockRecPredictor,
            patch("app.services.ocr_execution.DetectionPredictor") as MockDetPredictor,
        ):
            # Set up the mock to return our test result
            mock_rec_instance = MockRecPredictor.return_value
            mock_rec_instance.return_value = mock_recognition_result

            # Execute OCR job
            job_id = await ocr.execute()

            # Wait for job to complete
            job_info = await self._wait_for_ocr_job(job_id)

            # Get job info and verify
            assert job_info["status"] == "completed"
            assert "result" in job_info
            assert job_info["result"]["text"] == "Sample OCR text"
            assert len(job_info["result"]["blocks"]) == 2

            # Verify file path was correctly passed
            assert job_info["file_path"] == "@__fixtures__/image/easy_clear.png"

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_real_ocr_on_easy_clear_image(self, easy_clear_image_file):
        """Test actual OCR processing on the easy_clear.png image without mocking.

        This test performs real OCR and verifies that the text is extracted correctly.
        It's marked as an integration test since it depends on the actual OCR engine.
        """
        # Create OCR execution instance with real image file
        ocr = OCRExecution(file_path=easy_clear_image_file)

        # Execute OCR job with real OCR processing
        job_id = await ocr.execute()

        # Wait for job to complete
        job_info = await self._wait_for_ocr_job(job_id)

        # Verify job completed successfully
        assert job_info is not None
        assert (
            job_info["status"] == "completed"
        ), f"OCR failed with error: {job_info.get('error', 'Unknown error')}"
        assert "result" in job_info

        # Verify results contain expected text from the real estate transaction highlights image
        ocr_text = job_info["result"]["text"]
        assert ocr_text, "OCR result should contain text"

        # Check for key elements in the real estate transaction image
        expected_phrases = [
            "Real Estate Transaction Highlights",
            "City",
            "Year",
            "San Francisco",
            "New York",
            "Philadelphia",
            "Denver",
            "Phoenix",
            "Indianapolis",
            "Healthcare Facilities",
            "Commercial Industrial",
            "Retail",
            "Data Centers",
        ]

        # There should be at least some of these phrases present in properly processed text
        matches = [
            phrase for phrase in expected_phrases if phrase.lower() in ocr_text.lower()
        ]
        assert (
            len(matches) >= 5
        ), f"Expected to find at least 5 key phrases in OCR text, found {len(matches)}: {matches}"

        # Verify that text blocks were detected
        assert (
            len(job_info["result"].get("blocks", [])) > 0
        ), "OCR should detect at least one text block"

        # Check structure of extracted blocks
        for block in job_info["result"]["blocks"]:
            assert "text" in block, "Block should have text"
            assert "confidence" in block, "Block should have confidence score"
            assert "bbox" in block, "Block should have bounding box"

        # Print summary of extraction results
        print(f"OCR extracted {len(job_info['result']['blocks'])} text blocks")
        print(
            f"OCR detected {len(matches)}/{len(expected_phrases)} expected phrases: {matches}"
        )

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_numeric_extraction_from_easy_clear_image(
        self, easy_clear_image_file
    ):
        """Test extraction of numerical data from the real estate transaction image.

        This test specifically focuses on the numerical values in the table and validates
        that the OCR engine can properly extract monetary values and other numbers.
        """
        # Create OCR execution instance with real image file
        ocr = OCRExecution(file_path=easy_clear_image_file)

        # Execute OCR job with real OCR processing
        job_id = await ocr.execute()

        # Wait for job to complete
        job_info = await self._wait_for_ocr_job(job_id)

        # Verify job completed successfully
        assert job_info is not None
        assert (
            job_info["status"] == "completed"
        ), f"OCR failed with error: {job_info.get('error', 'Unknown error')}"
        assert "result" in job_info

        # Get the OCR text
        ocr_text = job_info["result"]["text"]

        # Expected monetary values from the image (sample of key values)
        expected_monetary_values = [
            "$48M",
            "$271M",
            "$213M",
            "$269M",
            "$234M",
            "$123M",  # Transaction totals
            "$6.5M",
            "$67.0M",
            "$16.1M",
            "$80.9M",
            "$75.2M",
            "$46.9M",  # Healthcare
            "$24.5M",
            "$54.4M",
            "$54.6M",
            "$64.5M",
            "$80.2M",
            "$45.4M",  # Retail
            "$12.9M",
            "$77.4M",
            "$68.9M",
            "$84.5M",
            "$28.4M",
            "$8.8M",  # Data Centers
        ]

        # Expected numeric values
        expected_numeric_values = [
            "269",
            "431",
            "95",
            "362",
            "493",
            "359",  # Permits
            "2024",  # Year
        ]

        # Count how many expected values were found
        monetary_matches = 0
        numeric_matches = 0

        for value in expected_monetary_values:
            # Remove the $ and M to just get the number
            clean_value = value.replace("$", "").replace("M", "")

            # Look for either the exact format ($48M) or variations ($48 M, $48 million, 48M, etc)
            if (
                value in ocr_text
                or f"${clean_value} M" in ocr_text
                or f"${clean_value}M" in ocr_text
                or f"{clean_value}M" in ocr_text
            ):
                monetary_matches += 1

        for value in expected_numeric_values:
            if value in ocr_text:
                numeric_matches += 1

        # We should find at least some percentage of the expected values
        min_monetary_matches = len(expected_monetary_values) * 0.2  # At least 20%
        min_numeric_matches = len(expected_numeric_values) * 0.3  # At least 30%

        assert (
            monetary_matches >= min_monetary_matches
        ), f"Expected to find at least {min_monetary_matches} monetary values, but found {monetary_matches}"
        assert (
            numeric_matches >= min_numeric_matches
        ), f"Expected to find at least {min_numeric_matches} numeric values, but found {numeric_matches}"

        # Print summary of matched values
        print(
            f"OCR detected {monetary_matches}/{len(expected_monetary_values)} monetary values"
        )
        print(
            f"OCR detected {numeric_matches}/{len(expected_numeric_values)} numeric values"
        )

        # BONUS: Try to extract the table structure
        # This is a more advanced test and may not always pass depending on OCR quality
        # Look for blocks with high confidence that contain monetary values
        high_confidence_blocks = [
            block
            for block in job_info["result"]["blocks"]
            if block.get("confidence", 0) > 0.7 and "$" in block.get("text", "")
        ]

        print(
            f"Found {len(high_confidence_blocks)} high-confidence blocks containing monetary values"
        )

    @pytest.mark.asyncio
    async def test_execute_with_custom_language(
        self, sample_image_file, mock_recognition_result
    ):
        """Test OCR execution with custom language setting."""
        # Create OCR execution with specific language
        ocr = OCRExecution(file_path=sample_image_file, languages=["fr"])

        # Mock the Surya OCR process
        with (
            patch(
                "app.services.ocr_execution.RecognitionPredictor"
            ) as MockRecPredictor,
            patch("app.services.ocr_execution.DetectionPredictor") as MockDetPredictor,
        ):

            # Set up the mock to return our test result
            mock_rec_instance = MockRecPredictor.return_value
            mock_rec_instance.return_value = mock_recognition_result

            # Execute OCR job
            job_id = await ocr.execute()

            # Wait for job to complete
            job_info = await self._wait_for_ocr_job(job_id)

            # Verify RecognitionPredictor was called with correct language
            mock_rec_instance.assert_called_once()
            # Check the 2nd arg (languages list) contains our language list
            args, _ = mock_rec_instance.call_args
            assert args[1] == [["fr"]]


if __name__ == "__main__":
    """Run the tests individually."""
    pytest.main(["-xvs", __file__])

"""
Service for OCR execution using various OCR engines.
Currently supports Surya OCR engine.
"""

import os
import asyncio
import logging
from enum import Enum
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import uuid
from pathlib import Path
from PIL import Image

# Import Surya OCR components
from surya.recognition import RecognitionPredictor
from surya.detection import DetectionPredictor

from app.executors.base_executor import BaseExecutor

logger = logging.getLogger(__name__)


class OCREngine(Enum):
    """Supported OCR engines."""

    SURYA_OCR = "surya_ocr"


class OCRStatus(Enum):
    """Status of OCR job execution."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class OCRExecutor(BaseExecutor):
    """
    Handles asynchronous OCR processing jobs.

    This class manages OCR execution using different OCR engines.
    Currently supports Surya OCR.
    """

    def __init__(
        self,
        file_path: str,
        ocr_engine: OCREngine = OCREngine.SURYA_OCR,
        languages: Optional[List[str]] = None,
    ):
        """
        Initialize OCR execution job.

        Args:
            file_path: Path to the image file for OCR
            ocr_engine: OCR engine to use (default: SURYA_OCR)
            languages: List of language codes to use for OCR. If None, automatic language detection is used.
        """
        self.job_id = str(uuid.uuid4())
        self.file_path = file_path
        self.ocr_engine = ocr_engine
        self.languages = languages
        self.status = OCRStatus.PENDING
        self.created_at = datetime.now()
        self.completed_at = None
        self.result = None
        self.error = None

    async def execute(self) -> str:
        """
        Execute OCR job asynchronously.

        Returns:
            Job ID
        """
        # Start OCR execution in a background task
        asyncio.create_task(self._process_ocr())
        return self.job_id

    async def _process_ocr(self) -> None:
        """
        Process OCR job based on selected engine.
        Updates job status and result on completion.
        """
        try:
            # Update status to processing
            self.status = OCRStatus.PROCESSING

            # Check if file exists
            if not os.path.exists(self.file_path):
                raise FileNotFoundError(f"File not found: {self.file_path}")

            # Process based on selected engine
            if self.ocr_engine == OCREngine.SURYA_OCR:
                result = await self._process_with_surya_ocr()
            else:
                raise ValueError(f"Unsupported OCR engine: {self.ocr_engine.value}")

            # Update job with result
            self.result = result
            self.status = OCRStatus.COMPLETED
            self.completed_at = datetime.now()

            logger.info(f"OCR job {self.job_id} completed successfully")

        except Exception as e:
            # Handle errors
            logger.error(f"Error in OCR job {self.job_id}: {str(e)}")
            self.status = OCRStatus.FAILED
            self.error = str(e)
            self.completed_at = datetime.now()

    async def _process_with_surya_ocr(self) -> Dict[str, Any]:
        """
        Process image with Surya OCR.

        Returns:
            OCR results
        """
        # Run CPU-intensive OCR processing in a thread pool
        return await asyncio.to_thread(self._run_surya_ocr)

    def _run_surya_ocr(self) -> Dict[str, Any]:
        """
        Run Surya OCR on the image file.
        This method is executed in a thread pool to avoid blocking the event loop.

        Returns:
            Dictionary with OCR results
        """
        try:
            # Open the image
            image = Image.open(self.file_path)

            # Initialize predictors
            recognition_predictor = RecognitionPredictor()
            detection_predictor = DetectionPredictor()

            # Process image with Surya OCR
            predictions = recognition_predictor(
                [image], [self.languages], detection_predictor
            )

            # Format results
            formatted_results = self._format_surya_results(predictions)

            return formatted_results

        except Exception as e:
            logger.error(f"Error in Surya OCR processing: {str(e)}")
            raise

    def _format_surya_results(self, predictions: Any) -> Dict[str, Any]:
        """
        Format Surya OCR results into a standardized structure.

        Args:
            predictions: Raw predictions from Surya OCR

        Returns:
            Formatted OCR results
        """
        # Extract text and bounding boxes from predictions
        # Note: Adjust this based on actual Surya OCR output structure
        result = {"text": predictions[0].text if predictions else "", "blocks": []}

        # Process text blocks if available
        if predictions and hasattr(predictions[0], "blocks"):
            for block in predictions[0].blocks:
                result["blocks"].append(
                    {
                        "text": block.text,
                        "confidence": block.confidence,
                        "bbox": (
                            block.bbox.tolist()
                            if hasattr(block.bbox, "tolist")
                            else block.bbox
                        ),
                    }
                )

        return result

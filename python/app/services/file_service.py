"""
File service for managing DatasetFile operations.
Provides methods to read dataset files by ID or multiple IDs.
"""

import os
from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.db import get_db
from app.models.dataset_file import DatasetFile


class FileService:
    """Service for handling operations related to dataset files."""

    @staticmethod
    def get_file_by_id(db: Session, file_id: str) -> Optional[DatasetFile]:
        """
        Retrieve a dataset file by its ID.

        Args:
            db: SQLAlchemy database session
            file_id: The unique identifier of the dataset file.

        Returns:
            The dataset file if found, None otherwise.
        """
        return db.query(DatasetFile).filter(DatasetFile.id == file_id).first()

    @staticmethod
    def get_files_by_ids(db: Session, file_ids: List[str]) -> List[DatasetFile]:
        """
        Retrieve multiple dataset files by their IDs.

        Args:
            db: SQLAlchemy database session
            file_ids: A list of dataset file IDs to retrieve.

        Returns:
            A list of found dataset files. Files that couldn't be found will be omitted.
        """
        return db.query(DatasetFile).filter(DatasetFile.id.in_(file_ids)).all()

    @staticmethod
    def get_file_content(db: Session, file_id: str) -> Optional[bytes]:
        """
        Get the content of a file by its ID.

        Args:
            db: SQLAlchemy database session
            file_id: The unique identifier of the dataset file.

        Returns:
            The file content as bytes if file exists, None otherwise.
        """
        file = FileService.get_file_by_id(db, file_id)

        if not file:
            return None

        # Check if the file exists on disk
        if not os.path.exists(file.path):
            return None

        # Read and return the file content
        with open(file.path, "rb") as f:
            return f.read()

    @staticmethod
    def get_files_metadata(db: Session, file_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Get metadata for multiple files by their IDs.

        Args:
            db: SQLAlchemy database session
            file_ids: A list of dataset file IDs.

        Returns:
            A list of dictionaries containing metadata for each found file.
        """
        files = FileService.get_files_by_ids(db, file_ids)

        metadata = []
        for file in files:
            metadata.append(
                {
                    "id": file.id,
                    "filename": file.filename,
                    "contentType": file.contentType,
                    "size": file.size,
                    "uploadedAt": file.uploadedAt,
                }
            )

        return metadata

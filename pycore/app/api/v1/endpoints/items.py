from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.schemas import Item, ItemCreate, ItemUpdate
from app.services import item_service

router = APIRouter(prefix="/items", tags=["items"])


@router.get("/", response_model=List[Item])
async def read_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Get all items with pagination.

    Args:
        skip: Records to skip
        limit: Maximum records to return
        db: Database session

    Returns:
        List of items
    """
    return item_service.get_items(db, skip=skip, limit=limit)


@router.get("/{item_id}", response_model=Item)
async def read_item(item_id: int, db: Session = Depends(get_db)):
    """
    Get an item by ID.

    Args:
        item_id: Item ID
        db: Database session

    Returns:
        Item if found

    Raises:
        HTTPException: If item not found
    """
    item = item_service.get_item(db, item_id=item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("/", response_model=Item, status_code=status.HTTP_201_CREATED)
async def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    """
    Create a new item.

    Args:
        item: Item data
        db: Database session

    Returns:
        Created item
    """
    return item_service.create_item(db=db, item=item)


@router.put("/{item_id}", response_model=Item)
async def update_item(item_id: int, item: ItemUpdate, db: Session = Depends(get_db)):
    """
    Update an item.

    Args:
        item_id: Item ID
        item: Updated item data
        db: Database session

    Returns:
        Updated item

    Raises:
        HTTPException: If item not found
    """
    db_item = item_service.update_item(db=db, item_id=item_id, item=item)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: int, db: Session = Depends(get_db)):
    """
    Delete an item.

    Args:
        item_id: Item ID
        db: Database session

    Raises:
        HTTPException: If item not found
    """
    success = item_service.delete_item(db=db, item_id=item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return None

from ninja import Router, Query
from typing import List
from django.shortcuts import get_object_or_404
from trainer_api.models import Model
from ..schemas.models import ModelIn, ModelOut, ErrorResponse

router = Router(tags=["models"])


@router.get("/", response=List[ModelOut])
def list_models(request, search: str = None):
    """Get all models with optional filtering"""
    queryset = Model.objects.all()
    if search:
        queryset = queryset.filter(name__icontains=search)
    return queryset


@router.post("/", response={201: ModelOut, 400: ErrorResponse})
def create_model(request, payload: ModelIn):
    """Create a new model"""
    try:
        model = Model.objects.create(
            name=payload.name, description=payload.description, owner=request.user
        )
        return 201, model
    except Exception as e:
        return 400, {"message": str(e)}


@router.get("/{model_id}", response={200: ModelOut, 404: ErrorResponse})
def get_model(request, model_id: int):
    """Get a specific model by ID"""
    try:
        model = get_object_or_404(Model, id=model_id)
        return 200, model
    except Model.DoesNotExist:
        return 404, {"message": "Model not found"}


@router.put("/{model_id}", response={200: ModelOut, 404: ErrorResponse})
def update_model(request, model_id: int, payload: ModelIn):
    """Update an existing model"""
    try:
        model = get_object_or_404(Model, id=model_id)
        model.name = payload.name
        model.description = payload.description
        model.save()
        return 200, model
    except Model.DoesNotExist:
        return 404, {"message": "Model not found"}


@router.delete("/{model_id}", response={204: None, 404: ErrorResponse})
def delete_model(request, model_id: int):
    """Delete a model"""
    try:
        model = get_object_or_404(Model, id=model_id)
        model.delete()
        return 204, None
    except Model.DoesNotExist:
        return 404, {"message": "Model not found"}

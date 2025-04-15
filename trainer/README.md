# Trainer in Django

Trainer is like a worker-like ASGI app that is intended to handle GPU training job.

For Windows, please use WSL to run the app.

## Quick Start

Login to HuggingFace

```
huggingface-cli login
```

Python version `>=3.10`
Run on linux with Nvidia GPU, as it requires CUDA

```
pip install -r requirements.txt
daphne trainer.asgi:application
```

## Run in watch mode

```
python watch.py
```

## Run Unit Tests

```
python manage.py test trainer_api.tests
```

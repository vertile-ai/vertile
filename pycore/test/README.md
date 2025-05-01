# Vertile API Tests

This directory contains tests for the Vertile API.

## Running Tests

### Setup

Ensure you have the development dependencies installed:

```bash
pip install -e ".[dev]"
```

### Running All Tests

To run all tests with pytest:

```bash
pytest
```

### Running Specific Test Files

To run a specific test file:

```bash
pytest test/services/test_ocr_execution.py
```

### Running Individual Tests

To run an individual test file directly:

```bash
python -m test.services.test_ocr_execution
```

Or to run a specific test function:

```bash
pytest test/services/test_ocr_execution.py::TestOCRExecution::test_init
```

### Code Coverage

To generate a code coverage report:

```bash
pytest --cov=app test/
```

For a detailed HTML report:

```bash
pytest --cov=app --cov-report=html test/
```

This will generate an HTML report in the `htmlcov` directory.

## Test Structure

Tests are organized to mirror the application structure:

- `services/` - Tests for service layer components

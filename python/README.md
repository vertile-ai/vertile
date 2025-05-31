# Vertile FastAPI Backend

## Getting Started

### Prerequisites

- Python 3.8+
- pip or uv package manager
- (Optional) Docker and Docker Compose for containerized deployment
- PostgreSQL database (provided via Docker Compose)

### Installation

#### Local Development

1. Clone the repository
2. Create a virtual environment:
   ```
   python -m venv .venv
   .venv\Scripts\activate  # On Windows
   source .venv/bin/activate  # On Unix/MacOS
   ```
3. Install dependencies:

   ```
   pip install -e .
   ```

   or with uv:

   ```
   uv pip install -e .
   ```

   To install with development dependencies:

   ```
   pip install -e ".[dev]"
   ```

   or with uv:

   ```
   uv pip install -e ".[dev]"
   ```

4. Create `.env` file:
   ```
   cp .env.example .env
   ```
   Adjust settings in `.env` as needed.

#### Docker Deployment

The API service is now integrated with the main project's docker-compose.yml at the root directory. To run with Docker:

1. Navigate to the project root directory (not pycore)

2. Build and start all containers:

   ```
   docker-compose up -d
   ```

3. To stop the containers:
   ```
   docker-compose down
   ```

### Running the Application

#### Local Development

Run the development server:

```
python run.py
```

#### Docker

From the project root directory:

```
docker-compose up
```

The API will be available at:

- API documentation: http://localhost:8000/docs
- API endpoints: http://localhost:8000/api/v1/...
- WebSocket endpoint: ws://localhost:8000/ws

## Usage

### REST API

Example API request:

```
GET http://localhost:8000/api/v1/health
```

Response:

```json
{
  "status": "healthy"
}
```

Example of a background task:

```
POST http://localhost:8000/api/v1/tasks
```

Response:

```json
{
  "task_id": "task-1713399450.3549063",
  "status": "processing"
}
```

### WebSocket

Connect to the WebSocket endpoint:

```
ws://localhost:8000/ws
```

Send a message and receive an echo response.

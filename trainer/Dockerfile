FROM anibali/pytorch:2.0.1-cuda11.8-ubuntu22.04
WORKDIR /trainer
COPY requirements.txt ./
COPY . .
RUN pip install -r requirements.txt
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "trainer.asgi:application"]
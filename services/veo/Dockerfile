FROM python:3.11-slim-bookworm

WORKDIR /app

# Install dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY main.py .

ENV PORT=8080
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

CMD exec gunicorn --bind 0.0.0.0:$PORT --timeout 360 --workers 1 main:app

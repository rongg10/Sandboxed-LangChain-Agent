FROM python:3.11-slim

# Install Node 18 for the Pyodide runner used by the sandbox tool.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node dependencies (pyodide lives in node_modules).
COPY package.json package-lock.json /app/
RUN npm ci --omit=dev

# Install Python dependencies.
COPY requirements.txt /app/requirements.txt
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the rest of the repo.
COPY . /app

ENV PYTHONUNBUFFERED=1
ENV NODE_BIN=node

CMD ["uvicorn", "backend.server:app", "--host", "0.0.0.0", "--port", "10000"]

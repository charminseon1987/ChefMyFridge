
# Use specific stable Debian Bookworm image
FROM python:3.11-slim-bookworm

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 1. Install HEADLESS OpenCV first
RUN pip install --no-cache-dir opencv-python-headless

# 2. Install CPU-only PyTorch FIRST from the PyTorch-specific index
# This ensures we get the lightweight version (approx 100MB instead of 1GB+)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# 3. Install Ultralytics explicitly from STANDARD PyPI
# Since torch is already installed above, it should verify the version and skip re-downloading
RUN pip install --no-cache-dir ultralytics

# Copy requirements file (which no longer has ultralytics)
COPY requirements.txt .

# 4. Install remaining dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
ENV PORT=8000
EXPOSE 8000

# Command to run the application
CMD ["python", "run.py"]

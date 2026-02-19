
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

# Install HEADLESS OpenCV first to avoid pulling X11 deps
RUN pip install --no-cache-dir opencv-python-headless

# Install CPU-only PyTorch and Ultralytics together from the CPU index
# This ensures that when ultralytics asks for torch, it gets the CPU version
RUN pip install --no-cache-dir torch torchvision ultralytics --index-url https://download.pytorch.org/whl/cpu

# Copy requirements file
COPY requirements.txt .

# Install remaining dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
ENV PORT=8000
EXPOSE 8000

# Command to run the application
CMD ["python", "run.py"]

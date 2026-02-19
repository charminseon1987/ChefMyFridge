
# Use specific stable Debian Bookworm image
FROM python:3.11-slim-bookworm

# Set working directory
WORKDIR /app

# Install system dependencies
# libgl1 and libglib2.0-0 are still good to have for some CV dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 1. Install CPU-only PyTorch first (Critical for disk space)
# Using the CPU build avoids downloading ~1GB+ of CUDA libraries
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# 2. Install Headless OpenCV
# Avoids X11 dependencies and reduces size
RUN pip install --no-cache-dir opencv-python-headless

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
# We use --no-deps for ultralytics to avoid it pulling standard torch/opencv,
# but checking dependencies is usually safer. 
# Since we installed torch/opencv above, pip should normally respect them.
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
ENV PORT=8000
EXPOSE 8000

# Command to run the application
CMD ["python", "run.py"]

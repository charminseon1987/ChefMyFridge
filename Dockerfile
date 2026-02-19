
# Use specific stable Debian Bookworm image to avoid "Trixie" (testing) instability
FROM python:3.11-slim-bookworm

# Set working directory
WORKDIR /app

# Install system dependencies
# libgl1 is the correct package for Debian Bookworm+
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
ENV PORT=8000
EXPOSE 8000

# Command to run the application
CMD ["python", "run.py"]

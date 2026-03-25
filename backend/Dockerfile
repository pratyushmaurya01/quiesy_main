# 1. Base image Python 3.10 le rahe hain
FROM python:3.10-slim

# 2. Render ko bol rahe hain ki Java (JDK) install karo (C++ hata diya hai)
RUN apt-get update && apt-get install -y \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

# 3. Server ke andar humara working folder /app hoga
WORKDIR /app

# 4. Requirements file copy karo aur libraries install karo
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Aapka baaki saara code copy karo
COPY . .

# 6. Django server ko Gunicorn ke sath start karo (Production ke liye zaroori hai)
# NOTE: Agar aapke project folder ka naam 'backend' nahi hai (jisme settings.py hoti hai), 
# toh yahan 'backend' ki jagah wo naam likh dena.
CMD sh -c "python manage.py migrate && gunicorn backend.wsgi:application --bind 0.0.0.0:8000"
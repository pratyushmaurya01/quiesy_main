# 1. Base image Python 3.10 le rahe hain
FROM python:3.10-slim

# No local JDK needed since we use Judge0 API for code execution


# 3. Server ke andar humara working folder /app hoga
WORKDIR /app

# 4. Requirements file copy karo aur libraries install karo
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Aapka baaki saara code copy karo
COPY . .

# Collect static files for production (admin CSS etc)
RUN python manage.py collectstatic --noinput

# 6. Django server ko Gunicorn ke sath start karo
# NOTE: Free tier (512MB RAM) ke liye --workers 1 --threads 4 use karna best hai taaki OOM error na aaye
CMD sh -c "python manage.py migrate && gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 1 --threads 4 --access-logfile -"
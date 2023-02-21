FROM public.ecr.aws/lambda/python:3.9

# Install chrome dependecies
RUN yum install unzip atk at-spi2-atk gtk3 cups-libs pango libdrm \
    libXcomposite libXcursor libXdamage libXext libXtst libXt \
    libXrandr libXScrnSaver alsa-lib -y

# Copy install scripts
COPY requirements.txt /tmp/
COPY install-chrome.sh /tmp/

# Install chromium, chrome-driver
RUN /usr/bin/bash /tmp/install.sh

# Install npm packages and build
RUN npm run install
RUN npm run build

# # Install Python dependencies for function
RUN pip install --upgrade pip -q
RUN pip install -r /tmp/requirements.txt -q

# Remove unused packages

# COPY app.py /var/task/
# CMD [ "app.lambda_handler" ]

# Execute function
COPY main.py /var/task/
CMD [ "main.lambda_handler" ]
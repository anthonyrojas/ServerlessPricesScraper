FROM public.ecr.aws/lambda/python:3.9

# Install chrome dependecies
RUN yum install xz atk cups-libs gtk3 libXcomposite alsa-lib tar \
    libXcursor libXdamage libXext libXi libXrandr libXScrnSaver \
    libXtst pango at-spi2-atk libXt xorg-x11-server-Xvfb \
    xorg-x11-xauth dbus-glib dbus-glib-devel unzip bzip2 -y -q

# Copy install scripts
COPY requirements.txt /tmp/
COPY install-chrome.sh /tmp/

# Install chromium, chrome-driver
RUN /usr/bin/bash /tmp/install-chrome.sh

# Install Python dependencies for function
RUN pip install --upgrade pip -q
RUN pip install -r /tmp/requirements.txt -q

# Execute function
COPY main.py /var/task/
CMD [ "main.lambda_handler" ]
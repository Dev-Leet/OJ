# Use an official, lightweight Python image as the base.
# The 'slim' variant is smaller and contains the minimal packages needed to run Python.
FROM python:3.9-slim

# Set the working directory inside the container to /usr/src/app.
# This is where the code will be copied and executed.
WORKDIR /usr/src/app

# Copy the contents of the host directory (which will contain code.py and input.txt)
# into the container's working directory.
COPY . .

# Define the command to be executed when the container starts.
# It runs the Python interpreter on the `code.py` script.
# The judge.js file will pipe the input.txt content to this container's stdin.
CMD ["python", "code.py"]

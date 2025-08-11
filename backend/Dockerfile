# /backend/Dockerfile

# Stage 1: Use an official Node.js runtime as a parent image
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install backend dependencies
RUN npm install
RUN npm install axios 
# Copy the rest of the backend source code to the working directory
COPY . .

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Define the command to run the application
CMD ["npm", "run", "server"]

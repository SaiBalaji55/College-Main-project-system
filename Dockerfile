# Use the official Node.js lightweight image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first to leverage Docker's caching mechanism
COPY package*.json ./

# Install only production dependencies (speeds up build)
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port your Express backend runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]
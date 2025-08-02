FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S judge -u 1001

# Set permissions
RUN chown -R judge:nodejs /app
USER judge

EXPOSE 5000

CMD ["npm", "start"]
# Step 1: Use an official Node.js runtime as a parent image
FROM node:latest

# Step 2: Set the working directory in the container
WORKDIR /usr/src/app

# Step 3: Copy the package.json and package-lock.json (or yarn.lock) files
COPY package*.json ./

# Step 4: Install app dependencies
RUN npm install

# Step 5: Bundle app source inside Docker image
COPY . .

# Step 6: Build the Next.js app
RUN npm run build

# Step 7: Define the command to run the app
CMD ["npm", "start"]
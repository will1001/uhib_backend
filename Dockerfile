# Gunakan image node versi terbaru sebagai base image
FROM node:latest

# Set working directory di dalam container
WORKDIR /usr/src/app

# Salin package.json dan package-lock.json (jika ada) ke dalam working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin seluruh kode aplikasi Anda ke dalam working directory
COPY . .

# Expose port yang digunakan oleh aplikasi Express.js
EXPOSE 3003

# Command untuk menjalankan aplikasi saat container dijalankan
CMD ["node", "api/index.ts"]
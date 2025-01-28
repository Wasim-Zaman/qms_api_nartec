@echo off
echo 🚀 Starting deployment...

echo 📥 Pulling latest changes...
git pull

echo ⏸️ Stopping PM2 processes...
pm2 stop qms qms-workers

echo 🔄 Generating Prisma client...
npx prisma generate

echo ▶️ Restarting PM2 processes...
pm2 restart qms qms-workers

echo 💾 Saving PM2 configuration...
pm2 save

echo ✅ Deployment completed!
pause 
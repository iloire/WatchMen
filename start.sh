pm2 kill
gulp
pm2 flush
source env.sh
pm2 start run-monitor-server.js
pm2 start run-web-server.js
pm2 log 

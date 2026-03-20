#!/bin/bash
# FE 빠른 배포: 로컬 빌드 → 서버 rsync → nginx reload
# 사용법: ./deploy-fe.sh

set -e
cd "$(dirname "$0")/Climate-Bus-Map-FE"

echo "🔨 빌드 중..."
npm run build

echo "📤 서버 업로드 중..."
rsync -az --delete dist/ stw@stw.iptime.org:/home/stw/climatego/frontend-dist/

echo "🔄 nginx 재시작..."
ssh stw@stw.iptime.org "cd /home/stw/climatego && docker compose restart frontend"

echo "✅ 배포 완료!"

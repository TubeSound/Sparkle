# Sparkle
0. bokeh.jsインストール
 > npm install @bokeh/bokehjs   

1. フロントエンド
　
(1) backend/main.pyファイルを作成

(2) バックエンド起動
 >　uvicorn main:app --reload     

2. バックエンド
 (1) react + vite projectを作成
 > npm create vite@latest frontend -- --template react  
 > cd frontend
 > npm install

(2) 起動
> npm run dev

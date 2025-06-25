# main.py
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from bokeh.plotting import figure
from bokeh.embed import components
import asyncio
import pandas as pd
from datetime import datetime # datetimeオブジェクトを扱うため追加

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocketエンドポイントはリアルタイム更新用として保持（今回は直接は使わないが、将来のために）
@app.websocket("/ws/ticks")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        df = pd.read_csv("../data/cl_tick_data.csv")
        df['jst_ms'] = pd.to_datetime(df['jst'], format='ISO8601').astype('int64') // 10**6

        for _, row in df.iterrows():
            data = {
                "x": row["jst_ms"],
                "y": row["bid"]
            }
            await websocket.send_json(data)
            await asyncio.sleep(0.1)
    except Exception as e:
        print(f"WebSocket closed or error: {e}")
    finally:
        await websocket.close()

# Bokeh埋め込み用エンドポイント
@app.get("/bokeh-embed")
def get_bokeh_embed():
    df = pd.read_csv("../data/cl_tick_data.csv")

    if "jst" not in df.columns or "bid" not in df.columns:
        return JSONResponse(content={"error": "Missing 'jst' or 'bid' column"}, status_code=400)

    # x軸はミリ秒のUnixタイムスタンプに変換
    df['jst_ms'] = pd.to_datetime(df['jst'], format='ISO8601').astype('int64') // 10**6
    df = df.dropna(subset=["jst_ms", "bid"])

    x = df["jst_ms"] # 変換後の列を使用
    y = df["bid"]

    p = figure(
        x_axis_type="datetime", # ここは datetime のまま
        width=800,
        height=400,
        title="Tick Chart: Bid Price (Static Embed)",
        toolbar_location="above", # ツールバーを表示しておくとデバッグしやすい
        tools="pan,wheel_zoom,box_zoom,reset,save" # ツールを追加
    )

    p.line(x, y, line_width=2, color="navy", legend_label="Bid")
    p.yaxis.axis_label = "Bid Price"
    p.xaxis.axis_label = "Time"

    script, div = components(p)
    return JSONResponse(content={"script": script, "div": div})
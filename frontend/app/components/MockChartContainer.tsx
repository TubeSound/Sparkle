// MockChartContainer.tsx

// MockChartContainer.tsx
"use client"; // Reactフックを使うのでクライアントコンポーネントとして明示

import React, { useState, useEffect } from 'react';
import { RealTimeChartWindow } from './RealTimeChartWindow';

export function MockChartContainer() {
    // 型定義：1データ点（timestampはUNIX秒、valueは任意の指標値）
    type DataPoint = { timestamp: number; value: number };
    const [data, setData] = useState<DataPoint[]>([]);

    // 初期データとモックリアルタイムデータを生成・追加
    useEffect(() => {
        const fixedStart = new Date('2025-06-01T12:00:00Z').getTime() / 1000;
        const allPoints: DataPoint[] = [];

        for (let i = 0; i < 240; i++) {
            const timestamp = fixedStart + i * 30; // 30秒間隔
            let value = 100 + Math.sin(i * 0.1) * 20;
            if (i >= 237) value = 0; // 最後だけ変化を演出（異常テスト用）
            allPoints.push({ timestamp, value });
        }

        // 最初は50件だけ投入しておく
        setData(allPoints.slice(0, 50));

        // 残りをリアルタイム風に1件ずつ追加
        let index = 50;
        const interval = setInterval(() => {
            if (index < allPoints.length) {
                setData(prev => [...prev, allPoints[index++]]);
            } else {
                clearInterval(interval);
            }
        }, 300); // 0.3秒ごとに更新

        return () => clearInterval(interval);
    }, []);

    // CSV文字列に変換（ヘッダー + 各行）
    function convertToCSV(data: DataPoint[]): string {
        if (data.length === 0) return '';
        const headers = Object.keys(data[0]);
        const rows = data.map(d => headers.map(h => d[h as keyof DataPoint]).join(','));
        return [headers.join(','), ...rows].join('\n');
    }

    // CSVファイルをクライアントでダウンロード
    function downloadCSV(csvString: string, filename = 'mock_data.csv') {
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-2">モックチャート</h2>

            {/* CSVダウンロードボタン */}
            <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow mb-4"
                onClick={() => downloadCSV(convertToCSV(data))}
            >
                CSVダウンロード
            </button>

            {/* 時系列チャート描画 */}
            <RealTimeChartWindow
                data={data}
                xKey="timestamp"
                yKey="value"
                windowSeconds={3600} // 1時間分を表示
                width={1000}
                height={300}
            />
        </div>
    );
}

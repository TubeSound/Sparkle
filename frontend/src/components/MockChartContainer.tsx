import React, { useState, useEffect } from 'react';
import { RealTimeChartWindow } from './RealTimeChartWindow';

export function MockChartContainer() {
    type DataPoint = { timestamp: number; value: number };
    const [data, setData] = useState<DataPoint[]>([]);

    // 全データ生成
    useEffect(() => {
        const fixedStart = new Date('2025-06-01T12:00:00Z').getTime() / 1000;
        const allPoints: DataPoint[] = [];
        for (let i = 0; i < 240; i++) {
            const timestamp = fixedStart + i * 30; // 30秒ごと
            let value = 100 + Math.sin(i * 0.1) * 20;
            if (i >= 237) {
                value = 0; // 最後の3件だけ0
            }
            allPoints.push({ timestamp, value });
        }

        // 最初は50件だけ投入
        setData(allPoints.slice(0, 50));

        // 残りを1件ずつ追加
        let index = 50;
        const interval = setInterval(() => {
            if (index < allPoints.length) {
                setData(prev => [...prev, allPoints[index++]]);
            } else {
                clearInterval(interval);
            }
        }, 500); // 0.5秒間隔で追加

        return () => clearInterval(interval);
    }, []);

    // CSV変換
    function convertToCSV(data: DataPoint[]): string {
        if (data.length === 0) return '';
        const headers = Object.keys(data[0]);
        const rows = data.map(d => headers.map(h => d[h as keyof DataPoint]).join(','));
        return [headers.join(','), ...rows].join('\n');
    }

    // ダウンロード処理
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
        <div>
            <h2>モックチャート</h2>
            <button onClick={() => downloadCSV(convertToCSV(data))}>
                CSVダウンロード
            </button>
            <RealTimeChartWindow
                data={data}
                xKey="timestamp"
                yKey="value"
                windowSeconds={3600} // 60分固定
                width={1000}
                height={300}
            />
        </div>
    );
}

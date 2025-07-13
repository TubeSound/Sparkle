// app/chart-test/page.tsx

"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
// インポートパスから.tsx拡張子を削除
import CandleChart, { Candle } from '../components/CandleChart';

export default function Page() {
    const [candles, setCandles] = useState<Candle[]>([]);
    const [chartWidth, setChartWidth] = useState(0);
    const chartContainerRef = useRef<HTMLDivElement>(null);

    // サンプルCSVデータ
    const sampleCsvData = `jst,open,high,low,close
2023-01-01 09:00:00,100.00,105.50,98.20,103.10
2023-01-01 09:01:00,103.10,107.20,101.50,106.80
2023-01-01 09:02:00,106.80,108.00,104.30,105.50
2023-01-01 09:03:00,105.50,107.10,102.80,104.20
2023-01-01 09:04:00,104.20,106.50,100.10,102.90
2023-01-01 09:05:00,102.90,105.00,99.50,101.00
2023-01-01 09:06:00,101.00,103.50,97.80,99.20
2023-01-01 09:07:00,99.20,100.00,95.00,96.50
2023-01-01 09:08:00,96.50,98.00,94.00,97.50
2023-01-01 09:09:00,97.50,100.50,96.00,99.80
2023-01-01 09:10:00,99.80,102.00,98.50,101.50
2023-01-01 09:11:00,101.50,103.00,99.00,102.00
2023-01-01 09:12:00,102.00,104.50,100.50,103.80
2023-01-01 09:13:00,103.80,105.00,101.00,104.50
2023-01-01 09:14:00,104.50,106.00,102.50,105.20
2023-01-01 09:15:00,105.20,107.00,103.00,106.50
2023-01-01 09:16:00,106.50,108.00,104.00,107.80
2023-01-01 09:17:00,107.80,109.00,105.00,108.50
2023-01-01 09:18:00,108.50,110.00,106.00,109.20
2023-01-01 09:19:00,109.20,111.00,107.00,110.00
`;

    // CSV解析ロジック (手動で実装)
    // app/chart-test/page.tsx にこのコードをコピー＆ペーストしてください

    // CSV解析ロジック (最終修正版)
    const parseCsvData = useCallback((csvString: string) => {
        const lines = csvString.trim().split('\n');
        if (lines.length <= 1) { // ヘッダーのみ、または空の場合
            setCandles([]);
            console.log("Page: No data rows in CSV, setting candles to empty array.");
            return;
        }

        const header = lines[0].split(',').map(h => h.trim());
        const dataRows = lines.slice(1);
        const newCandles: Candle[] = [];

        dataRows.forEach((line, index) => {
            const values = line.split(',').map(v => v.trim());
            if (values.length !== header.length) {
                console.warn(`Page: Skipping malformed row at index ${index + 1}:`, line);
                return;
            }

            const rowData: { [key: string]: string } = {};
            header.forEach((h, i) => {
                rowData[h] = values[i];
            });

            // ▼▼▼▼▼【重要】ここが日付を正しく読み込むための核心部分です ▼▼▼▼▼
            const dateString = rowData["jst"];
            let timestamp = NaN;
            if (dateString) {
                // 日付と時刻の間のスペースを "T" に置換し、ISO 8601形式に準拠させる
                const isoDateString = dateString.replace(' ', 'T');
                const date = new Date(isoDateString);

                // dateが有効な日付かチェック
                if (!isNaN(date.getTime())) {
                    timestamp = date.getTime() / 1000; // UNIX秒に変換
                } else {
                    console.warn(`Page: Invalid date format at row ${index + 1}: "${dateString}" -> "${isoDateString}"`);
                }
            }
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

            const open = parseFloat(rowData["open"]);
            const high = parseFloat(rowData["high"]);
            const low = parseFloat(rowData["low"]);
            const close = parseFloat(rowData["close"]);

            // タイムスタンプを含む全てのデータが有効な数値かチェック
            if (isNaN(timestamp) || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
                console.warn("Page: Skipping row with invalid number value at index:", index + 1, { timestamp, open, high, low, close });
                return;
            }

            newCandles.push({ timestamp, open, high, low, close });
        });

        setCandles(newCandles);
        console.log("Page: Final parsed candles count:", newCandles.length);
    }, []);

    // ファイルアップロードハンドラ
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            parseCsvData(text);
        };
        reader.readAsText(file);
    };

    // コンポーネントマウント時にサンプルデータをロード
    useEffect(() => {
        parseCsvData(sampleCsvData);
    }, [parseCsvData, sampleCsvData]);

    // チャートコンテナの幅を監視し、チャートの幅を調整
    useEffect(() => {
        const updateChartWidth = () => {
            if (chartContainerRef.current) {
                setChartWidth(chartContainerRef.current.offsetWidth);
            }
        };

        updateChartWidth(); // 初期ロード時
        window.addEventListener('resize', updateChartWidth); // リサイズ時

        return () => window.removeEventListener('resize', updateChartWidth);
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 md:p-8 font-inter flex flex-col items-center">
            <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 flex flex-col gap-6">
                <h1 className="text-3xl font-extrabold text-white text-center mb-4">
                    <span className="bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
                        株式チャートビューア
                    </span>
                </h1>

                {/* CSVファイルアップロードセクション */}
                <div className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-600 rounded-md bg-gray-700">
                    <label htmlFor="file-upload" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105">
                        CSVファイルをアップロード
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <p className="mt-3 text-sm text-gray-400">
                        または、初期サンプルデータが表示されています。
                    </p>
                </div>

                {/* チャート描画エリア */}
                <div ref={chartContainerRef} className="w-full h-[400px] sm:h-[500px] md:h-[600px] bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                    {chartWidth > 0 && (
                        <CandleChart
                            data={candles}
                            width={chartWidth}
                            height={chartWidth * 0.6} // アスペクト比を維持
                        />
                    )}
                </div>

                {/* データ概要（オプション） */}
                {candles.length > 0 && (
                    <div className="bg-gray-700 p-4 rounded-md shadow-inner text-gray-300 text-sm">
                        <h3 className="text-lg font-semibold mb-2 text-white">データ概要</h3>
                        <p>読み込まれたローソク足の数: {candles.length}</p>
                        <p>最初のデータ: {new Date(candles[0].timestamp * 1000).toLocaleString()}</p>
                        <p>最後のデータ: {new Date(candles[candles.length - 1].timestamp * 1000).toLocaleString()}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

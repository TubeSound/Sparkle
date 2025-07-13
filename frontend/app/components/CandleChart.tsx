// app/components/CandleChart.tsx

import React from 'react';
import { scaleTime, scaleLinear } from '@visx/scale';
import { extent } from 'd3-array';
import { Group } from '@visx/group';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { localPoint } from '@visx/event';
import { TooltipWithBounds, defaultStyles, useTooltip } from '@visx/tooltip';
import { Line } from '@visx/shape'; // Rectをインポートから削除

// Candle データの型定義
export type Candle = {
    timestamp: number; // UNIX秒
    open: number;
    high: number;
    low: number;
    close: number;
};

// Propsの型定義
type CandleChartProps = {
    data: Candle[];
    width: number;
    height: number;
    margin?: { top: number; right: number; bottom: number; left: number };
};

// ツールチップのデータ型
type TooltipData = Candle;

export default function CandleChart({
    data,
    width,
    height,
    margin = { top: 20, right: 50, bottom: 40, left: 60 },
}: CandleChartProps) {
    const {
        tooltipData,
        tooltipLeft = 0,
        tooltipTop = 0,
        showTooltip,
        hideTooltip,
    } = useTooltip<TooltipData>();

    if (width <= 0 || height <= 0 || !data || data.length === 0) {
        return <div className="text-center text-gray-500 p-4">データがありません。または、チャートサイズが不正です。</div>;
    }

    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    const dateExtent = extent(data, (d) => d.timestamp * 1000);
    const priceValues = data.flatMap(d => [d.high, d.low]);
    const priceExtent = extent(priceValues);

    if (!dateExtent || !priceExtent || dateExtent[0] === undefined || priceExtent[0] === undefined) {
        return <div className="text-center text-gray-500 p-4">データの範囲を計算できませんでした。</div>;
    }

    const pricePadding = (priceExtent[1] - priceExtent[0]) * 0.1;

    const xScale = scaleTime({
        domain: dateExtent,
        range: [0, xMax],
    });

    const yScale = scaleLinear<number>({
        domain: [priceExtent[0] - pricePadding, priceExtent[1] + pricePadding],
        range: [yMax, 0],
    });

    const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
        const { x } = localPoint(event) || { x: 0 };
        const x0 = xScale.invert(x - margin.left);

        let closestIndex = 0;
        let minDiff = Infinity;
        data.forEach((d, i) => {
            const diff = Math.abs(x0.getTime() - (d.timestamp * 1000));
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        });

        const d = data[closestIndex];

        if (d) {
            showTooltip({
                tooltipData: d,
                tooltipLeft: xScale(d.timestamp * 1000),
                tooltipTop: yScale((d.high + d.low) / 2),
            });
        }
    };

    const barWidth = Math.max(1, xMax / (data.length * 1.5));

    return (
        <div className="relative" style={{ width, height }}>
            <svg width={width} height={height} onMouseLeave={hideTooltip}>
                <Group top={margin.top} left={margin.left}>
                    <AxisLeft
                        scale={yScale}
                        stroke="#e2e8f0"
                        tickStroke="#e2e8f0"
                        tickLabelProps={{
                            fill: '#94a3b8',
                            fontSize: 10,
                            textAnchor: 'end',
                            dy: '0.33em',
                        }}
                    />

                    <AxisBottom
                        top={yMax}
                        scale={xScale}
                        stroke="#e2e8f0"
                        tickStroke="transparent"
                        tickLabelProps={{ fill: 'transparent' }}
                    >
                        {(axis) => (
                            <g>
                                <line x1={0} y1={0} x2={xMax} y2={0} stroke="#e2e8f0" />
                                {axis.ticks.map((tick, i) => {
                                    // ▼▼▼【最終修正箇所】▼▼▼
                                    // tick.value を Number() で囲み、確実に数値に変換する
                                    const date = new Date(Number(tick.value));

                                    if (isNaN(date.getTime())) return null;

                                    const timeString = date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
                                    const dateString = date.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' });

                                    return (
                                        <g key={`axis-tick-${i}`} transform={`translate(${tick.from.x}, 0)`}>
                                            <line y2={6} stroke="#e2e8f0" />
                                            <text
                                                y={20}
                                                dy="0.71em"
                                                fill="#64748b"
                                                fontSize={9}
                                                textAnchor="middle"
                                            >
                                                <tspan x={0} dy="0">{timeString}</tspan>
                                                <tspan x={0} dy="1.2em">{dateString}</tspan>
                                            </text>
                                        </g>
                                    );
                                })}
                            </g>
                        )}
                    </AxisBottom>

                    {data.map((d) => {
                        const x = xScale(d.timestamp * 1000);
                        const yOpen = yScale(d.open);
                        const yClose = yScale(d.close);
                        const yHigh = yScale(d.high);
                        const yLow = yScale(d.low);
                        const color = d.close >= d.open ? '#4ade80' : '#ef4444';

                        return (
                            <g key={`candle-${d.timestamp}`}>
                                <Line from={{ x, y: yHigh }} to={{ x, y: yLow }} stroke={color} strokeWidth={1} />
                                {/* ▼▼▼ <Rect> を <rect> (小文字) に修正 ▼▼▼ */}
                                <rect
                                    x={x - barWidth / 2}
                                    y={Math.min(yOpen, yClose)}
                                    width={barWidth}
                                    height={Math.max(1, Math.abs(yOpen - yClose))}
                                    fill={color}
                                />
                            </g>
                        );
                    })}

                    {/* ▼▼▼ <Rect> を <rect> (小文字) に修正 ▼▼▼ */}
                    <rect
                        x={0} y={0}
                        width={xMax} height={yMax}
                        fill="transparent"
                        onMouseMove={handleMouseMove}
                    />

                    {tooltipData && (
                        <Line
                            from={{ x: tooltipLeft, y: 0 }}
                            to={{ x: tooltipLeft, y: yMax }}
                            stroke="#94a3b8"
                            strokeWidth={1}
                            pointerEvents="none"
                            strokeDasharray="2,2"
                        />
                    )}
                </Group>
            </svg>

            {tooltipData && (
                <TooltipWithBounds
                    key={Math.random()}
                    top={tooltipTop}
                    left={tooltipLeft + margin.left}
                    style={{ ...defaultStyles, backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', padding: '8px' }}
                >
                    <div><strong>時間:</strong> {new Date(tooltipData.timestamp * 1000).toLocaleString('ja-JP')}</div>
                    <div><strong>始値:</strong> {tooltipData.open.toFixed(2)}</div>
                    <div><strong>高値:</strong> {tooltipData.high.toFixed(2)}</div>
                    <div><strong>安値:</strong> {tooltipData.low.toFixed(2)}</div>
                    <div><strong>終値:</strong> {tooltipData.close.toFixed(2)}</div>
                </TooltipWithBounds>
            )}
        </div>
    );
}
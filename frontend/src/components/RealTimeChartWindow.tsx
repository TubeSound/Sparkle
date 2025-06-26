// RealTimeChartWindow.tsx

import React, { useMemo, useEffect } from 'react';
import { scaleLinear, scaleTime } from '@visx/scale';
import { extent } from 'd3-array';
import { LinePath } from '@visx/shape';
import { AxisBottom, AxisLeft } from '@visx/axis';

export type RealTimeChartProps<T extends Record<string, number>> = {
    data: T[];
    xKey: keyof T;
    yKey: keyof T;
    windowSeconds: number;
    width?: number;
    height?: number;
    margin?: { top: number; right: number; bottom: number; left: number };
};

export function RealTimeChartWindow<T extends Record<string, number>>({
    data,
    xKey,
    yKey,
    windowSeconds,
    width = 800,
    height = 300,
    margin = { top: 10, right: 10, bottom: 40, left: 50 },
}: RealTimeChartProps<T>) {
    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    useEffect(() => {
        console.log("=== チャート受信データ（データ長） ===", data.length);
        console.log("=== チャート受信データ（先頭3件） ===", data.slice(0, 3));
        console.log("=== チャート受信データ（末尾3件） ===", data.slice(-3));
    }, [data]);

    const lastTimestamp = data.length > 0 ? data[data.length - 1][xKey] : Date.now() / 1000;
    const xStart = lastTimestamp - windowSeconds;
    const xEnd = lastTimestamp;

    const slicedData = data.filter(d => d[xKey] >= xStart && d[xKey] <= xEnd);

    useEffect(() => {
        console.log("=== 整形データ（データ長） ===", slicedData.length);
        console.log("=== 整形データ（先頭3件） ===", slicedData.slice(0, 3));
        console.log("=== 整形データ（末尾3件） ===", slicedData.slice(-3));
    }, [slicedData]);

    const xScale = useMemo(() => {
        return scaleTime({
            domain: [xStart, xEnd],
            range: [0, xMax],
        });
    }, [xStart, xEnd, xMax]);

    const yScale = useMemo(() => {
        if (slicedData.length === 0) {
            return scaleLinear({ domain: [0, 1], range: [yMax, 0] });
        }
        const [min, max] = extent(slicedData, d => d[yKey]) as [number, number];
        const range = max - min || 1;
        const marginY = range * 0.2;
        return scaleLinear({
            domain: [min - marginY, max + marginY],
            range: [yMax, 0],
            nice: true,
        });
    }, [slicedData, yKey, yMax]);

    return (
        <svg width={width} height={height}>
            <g transform={`translate(${margin.left},${margin.top})`}>
                <LinePath
                    data={slicedData}
                    x={d => xScale(d[xKey]) ?? 0}
                    y={d => yScale(d[yKey]) ?? 0}
                    stroke="steelblue"
                    strokeWidth={2}
                />
                <AxisBottom
                    top={yMax}
                    scale={xScale}
                    tickFormat={t => new Date(t.valueOf() * 1000).toLocaleTimeString()}
                />
                <AxisLeft
                    scale={yScale}
                    tickFormat={v => Math.round(v).toLocaleString()}
                />
            </g>
        </svg>
    );
}
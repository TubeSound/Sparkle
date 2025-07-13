// RealTimeChartWindow.tsx

"use client";

import React, { useMemo, useEffect, useState } from 'react';
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

function convertToCSV<T extends Record<string, number>>(data: T[]): string {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(d => headers.map(h => d[h]).join(','));
    return [headers.join(','), ...rows].join('\n');
}

function downloadCSV(csvString: string, filename = 'buffer_dump.csv') {
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

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

    const [buffer, setBuffer] = useState<T[]>([]);
    const [hasDumped, setHasDumped] = useState(false);

    const DUMP_THRESHOLD = 0; // 0にするとダンプなし

    useEffect(() => {
        if (data.length === 0) return;
        setBuffer(prev => {
            const lastTimestamp = prev.length > 0 ? prev[prev.length - 1][xKey] : 0;
            const newData = data.filter(d => d[xKey] > lastTimestamp);
            const combined = [...prev, ...newData];
            const xEnd = combined[combined.length - 1][xKey];
            const xStart = xEnd - windowSeconds;
            return combined.filter(d => d[xKey] >= xStart);
        });
    }, [data, xKey, windowSeconds]);

    useEffect(() => {
        if (!hasDumped && DUMP_THRESHOLD > 0 && buffer.length >= DUMP_THRESHOLD) {
            const csv = convertToCSV(buffer);
            const now = new Date().toISOString().replace(/[:.]/g, '-');
            downloadCSV(csv, `buffer_dump_${now}.csv`);
            setHasDumped(true);
        }
    }, [buffer, hasDumped, DUMP_THRESHOLD]);

    const earliest = buffer.length > 0 ? buffer[0][xKey] : Date.now() / 1000;
    const latest = buffer.length > 0 ? buffer[buffer.length - 1][xKey] : earliest;

    let xStart = latest - windowSeconds;
    if (xStart < earliest) {
        xStart = earliest;
    }
    const xEnd = xStart + windowSeconds;

    const slicedData = buffer.filter(d => d[xKey] >= xStart && d[xKey] <= xEnd);

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
                    tickFormat={v => Math.round(v as number).toLocaleString()}
                />
            </g>
        </svg>
    );
}

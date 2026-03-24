import { Stack } from 'expo-router';
import { View } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { estimateBAC } from '@/lib/bac';
import { useApp } from '@/lib/context';
import { formatTime } from '@/lib/format';

const GRAPH_W = 340;
const GRAPH_H = 200;
const PAD = { top: 20, right: 20, bottom: 30, left: 40 };
const PLOT_W = GRAPH_W - PAD.left - PAD.right;
const PLOT_H = GRAPH_H - PAD.top - PAD.bottom;

export default function BacGraph() {
  const { userInfo, drinks, waterEntries, stomachStatus } = useApp();

  if (!userInfo || drinks.length === 0) {
    return (
      <View className="flex flex-1 bg-white items-center justify-center px-6">
        <Stack.Screen options={{ title: 'BAC Over Time' }} />
        <Text variant="muted" className="text-center">
          No drink data yet.{'\n'}Add some drinks to see the graph.
        </Text>
      </View>
    );
  }

  const sortedDrinks = [...drinks].sort((a, b) => a.time.getTime() - b.time.getTime());
  const firstDrinkTime = sortedDrinks[0].time.getTime();
  const now = Date.now();

  const endTime = now + 2 * 60 * 60 * 1000;
  const points: { time: number; bac: number }[] = [];
  const step = 15 * 60 * 1000;

  for (let t = firstDrinkTime; t <= endTime; t += step) {
    const bac = estimateBAC(drinks, userInfo, new Date(t), stomachStatus, waterEntries);
    points.push({ time: t, bac });
    if (bac === 0 && t > now) break;
  }

  const maxBac = Math.max(0.5, ...points.map((p) => p.bac));
  const timeStart = points[0].time;
  const timeEnd = points[points.length - 1].time;
  const timeRange = timeEnd - timeStart || 1;

  function x(time: number) {
    return PAD.left + ((time - timeStart) / timeRange) * PLOT_W;
  }

  function y(bac: number) {
    return PAD.top + PLOT_H - (bac / maxBac) * PLOT_H;
  }

  const polylinePoints = points.map((p) => `${x(p.time)},${y(p.bac)}`).join(' ');

  const currentBac = estimateBAC(drinks, userInfo, new Date(now), stomachStatus, waterEntries);

  const yLabels = [0, maxBac / 2, maxBac];
  const xLabelTimes = [timeStart, timeStart + timeRange / 2, timeEnd];

  return (
    <View className="flex flex-1 bg-white">
      <Stack.Screen options={{ title: 'BAC Over Time' }} />

      <View className="items-center pt-8 px-4">
        <Text variant="muted" className="mb-1">
          Current Level
        </Text>
        <Badge variant="default" className="mb-6 px-4 py-1.5">
          <Text className="text-4xl font-bold">{currentBac.toFixed(2)} ‰</Text>
        </Badge>

        <Card className="p-0">
          <CardContent className="items-center py-4">
            <Svg width={GRAPH_W} height={GRAPH_H}>
              {yLabels.map((val) => (
                <Line
                  key={`grid-${val}`}
                  x1={PAD.left}
                  y1={y(val)}
                  x2={PAD.left + PLOT_W}
                  y2={y(val)}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />
              ))}

              {yLabels.map((val) => (
                <SvgText
                  key={`ylabel-${val}`}
                  x={PAD.left - 8}
                  y={y(val) + 4}
                  fontSize={11}
                  fill="#9ca3af"
                  textAnchor="end">
                  {val.toFixed(1)}
                </SvgText>
              ))}

              {xLabelTimes.map((t, i) => (
                <SvgText
                  key={`xlabel-${i}`}
                  x={x(t)}
                  y={GRAPH_H - 4}
                  fontSize={11}
                  fill="#9ca3af"
                  textAnchor="middle">
                  {formatTime(new Date(t))}
                </SvgText>
              ))}

              <Polyline points={polylinePoints} fill="none" stroke="#6366f1" strokeWidth={2.5} />

              <Circle cx={x(now)} cy={y(currentBac)} r={5} fill="#6366f1" />
            </Svg>
          </CardContent>
        </Card>

        <Text variant="muted" className="mt-4">
          Graph shows estimated BAC from first drink to projected sobriety.
        </Text>
      </View>
    </View>
  );
}

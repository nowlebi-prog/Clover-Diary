import { useEffect, useMemo, useState } from "react";
import GlassCard from "../common/GlassCard";
import SectionTitle from "../common/SectionTitle";
import StatusBadge from "../common/StatusBadge";

const BUCHEON = { latitude: 37.5035, longitude: 126.766 };

const sameHourYesterday = (time) => {
  const date = new Date(time);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 13);
};

const signed = (value, unit) => {
  if (value === null || Number.isNaN(value)) return "비교 준비 중";
  if (value === 0) return `어제와 같아요`;
  return `어제보다 ${Math.abs(value).toFixed(value % 1 ? 1 : 0)}${unit} ${value > 0 ? "높아요" : "낮아요"}`;
};

export default function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({
      latitude: BUCHEON.latitude,
      longitude: BUCHEON.longitude,
      timezone: "Asia/Seoul",
      past_days: "1",
      forecast_days: "1",
      current: "temperature_2m,relative_humidity_2m",
      hourly: "temperature_2m,relative_humidity_2m"
    });

    fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
      .then((response) => {
        if (!response.ok) throw new Error("weather");
        return response.json();
      })
      .then(setWeather)
      .catch(() => setError("날씨를 불러오지 못했어요."));
  }, []);

  const summary = useMemo(() => {
    if (!weather?.current || !weather?.hourly) return null;
    const currentHour = weather.current.time?.slice(0, 13);
    const yesterdayHour = sameHourYesterday(weather.current.time);
    const index = weather.hourly.time?.findIndex((time) => time.slice(0, 13) === yesterdayHour);
    const yesterdayTemp = index >= 0 ? weather.hourly.temperature_2m[index] : null;
    const yesterdayHumidity = index >= 0 ? weather.hourly.relative_humidity_2m[index] : null;
    const temp = weather.current.temperature_2m;
    const humidity = weather.current.relative_humidity_2m;

    return {
      currentHour,
      temp,
      humidity,
      tempDelta: yesterdayTemp === null ? null : temp - yesterdayTemp,
      humidityDelta: yesterdayHumidity === null ? null : humidity - yesterdayHumidity
    };
  }, [weather]);

  return (
    <GlassCard className="bg-[#F7FBFF]/80">
      <SectionTitle action={<StatusBadge tone="blue">부천</StatusBadge>}>오늘 날씨</SectionTitle>
      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[22px] bg-white/65 p-4">
            <p className="text-xs font-bold text-clover-sub">온도</p>
            <p className="mt-1 text-3xl font-bold text-clover-deep">{Math.round(summary.temp)}°C</p>
            <p className="mt-2 text-sm text-clover-sub">{signed(summary.tempDelta, "°C")}</p>
          </div>
          <div className="rounded-[22px] bg-white/65 p-4">
            <p className="text-xs font-bold text-clover-sub">습도</p>
            <p className="mt-1 text-3xl font-bold text-clover-deep">{Math.round(summary.humidity)}%</p>
            <p className="mt-2 text-sm text-clover-sub">{signed(summary.humidityDelta, "%")}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-clover-sub">{error || "부천 날씨를 확인하고 있어요."}</p>
      )}
    </GlassCard>
  );
}

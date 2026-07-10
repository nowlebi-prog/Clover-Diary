import { useEffect, useMemo, useState } from "react";

const BUCHEON = { latitude: 37.5035, longitude: 126.766 };

export default function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [dust, setDust] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const weatherParams = new URLSearchParams({
      latitude: BUCHEON.latitude,
      longitude: BUCHEON.longitude,
      timezone: "Asia/Seoul",
      forecast_days: "1",
      current: "temperature_2m,relative_humidity_2m"
    });
    const airParams = new URLSearchParams({
      latitude: BUCHEON.latitude,
      longitude: BUCHEON.longitude,
      timezone: "Asia/Seoul",
      forecast_days: "1",
      current: "pm10,pm2_5"
    });

    fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams}`)
      .then((response) => {
        if (!response.ok) throw new Error("weather");
        return response.json();
      })
      .then(setWeather)
      .catch(() => setError("weather off"));
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams}`)
      .then((response) => response.ok ? response.json() : null)
      .then(setDust)
      .catch(() => setDust(null));
  }, []);

  const summary = useMemo(() => {
    if (!weather?.current) return null;
    return {
      temp: Math.round(weather.current.temperature_2m),
      humidity: Math.round(weather.current.relative_humidity_2m),
      pm10: dust?.current?.pm10 ? Math.round(dust.current.pm10) : null,
      pm25: dust?.current?.pm2_5 ? Math.round(dust.current.pm2_5) : null
    };
  }, [weather, dust]);

  const dustLabel = summary?.pm10 === null ? "미세먼지 확인중" : `미세 ${summary.pm10} · 초미세 ${summary.pm25}`;

  return (
    <span className="inline-flex min-h-11 items-center gap-3 rounded-full border border-white/70 bg-white/70 px-4 text-xs font-bold text-clover-deep shadow-glass backdrop-blur-xl">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#E8F7FF] text-lg">☀️</span>
      {summary ? `Bucheon · ${summary.temp}°C · 습도 ${summary.humidity}% · ${dustLabel}` : error || "weather loading"}
    </span>
  );
}

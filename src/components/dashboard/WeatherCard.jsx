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
      .catch(() => setError("날씨 확인 불가"));

    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams}`)
      .then((response) => (response.ok ? response.json() : null))
      .then(setDust)
      .catch(() => setDust(null));
  }, []);

  const summary = useMemo(() => {
    const current = weather?.current;
    if (!current) return null;
    const air = dust?.current || {};
    return {
      temp: Number.isFinite(current.temperature_2m) ? Math.round(current.temperature_2m) : null,
      humidity: Number.isFinite(current.relative_humidity_2m) ? Math.round(current.relative_humidity_2m) : null,
      pm10: Number.isFinite(air.pm10) ? Math.round(air.pm10) : null,
      pm25: Number.isFinite(air.pm2_5) ? Math.round(air.pm2_5) : null
    };
  }, [weather, dust]);

  const dustLabel = !summary
    ? "날씨 확인중"
    : summary.pm10 === null || summary.pm25 === null
      ? "미세먼지 확인중"
      : `미세 ${summary.pm10} · 초미세 ${summary.pm25}`;

  const weatherLabel = summary
    ? `Bucheon · ${summary.temp ?? "-"}°C · 습도 ${summary.humidity ?? "-"}% · ${dustLabel}`
    : error || dustLabel;

  return (
    <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 text-[11px] font-bold text-clover-deep shadow-glass backdrop-blur-xl">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[#E8F7FF] text-base">☀️</span>
      {weatherLabel}
    </span>
  );
}

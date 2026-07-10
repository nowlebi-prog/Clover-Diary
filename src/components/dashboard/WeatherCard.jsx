import { useEffect, useMemo, useState } from "react";

const BUCHEON = { latitude: 37.5035, longitude: 126.766 };

export default function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({
      latitude: BUCHEON.latitude,
      longitude: BUCHEON.longitude,
      timezone: "Asia/Seoul",
      forecast_days: "1",
      current: "temperature_2m,relative_humidity_2m"
    });

    fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
      .then((response) => {
        if (!response.ok) throw new Error("weather");
        return response.json();
      })
      .then(setWeather)
      .catch(() => setError("weather off"));
  }, []);

  const summary = useMemo(() => {
    if (!weather?.current) return null;
    return {
      temp: Math.round(weather.current.temperature_2m),
      humidity: Math.round(weather.current.relative_humidity_2m)
    };
  }, [weather]);

  return (
    <span className="inline-flex min-h-10 items-center rounded-full border border-white/70 bg-white/65 px-4 text-xs font-bold text-clover-deep shadow-glass backdrop-blur-xl">
      {summary ? `Bucheon · ${summary.temp}°C · humidity ${summary.humidity}%` : error || "weather loading"}
    </span>
  );
}

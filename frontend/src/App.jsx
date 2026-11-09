import React, { useState, useEffect, useRef } from 'react';
import MapComponent from './MapComponent';

const STATIONS = {
  hub: [48.6836, 8.9831],
  Mercaden: [48.6845, 9.0094],
  Kaufland: [48.6912, 9.0205],
  Diezenhalde: [48.6657, 9.0195]
};

export default function App() {
  const [lkwStatus, setLkwStatus] = useState({
    status: "IDLE",
    location: "Загрузка...",
    current_cargo: null,
    weight: 0
  });
  const [cargoName, setCargoName] = useState("Lebensmittel");
  const [weight, setWeight] = useState(4.5);
  const [message, setMessage] = useState("");

  const [truckPos, setTruckPos] = useState(STATIONS.hub);
  const [routeCoords, setRouteCoords] = useState([]);
  const animationIntervalRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
const res = await fetch("http://127.0.0.1:8000/api/v1/lkw-status");
        if (res.ok) {
          const data = await res.json();
          setLkwStatus(data);

          if (data.status !== "EN_ROUTE" && animationIntervalRef.current) {
            clearInterval(animationIntervalRef.current);
            animationIntervalRef.current = null;
            const dest = data.location.includes("Mercaden") ? STATIONS.Mercaden :
                         data.location.includes("Kaufland") ? STATIONS.Kaufland :
                         data.location.includes("Diezenhalde") ? STATIONS.Diezenhalde : STATIONS.hub;
            setTruckPos(dest);
          }
          if (data.status === "IDLE") {
            setTruckPos(STATIONS.hub);
            setRouteCoords([]);
          }
        }
      } catch (err) {
        console.error("Бэкенд не отвечает");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const startTruckAnimation = (coords) => {
    if (animationIntervalRef.current) clearInterval(animationIntervalRef.current);
    let index = 0;
    const stepTime = Math.max(30, Math.floor(10000 / coords.length));

    animationIntervalRef.current = setInterval(() => {
      if (index < coords.length) {
        setTruckPos(coords[index]);
        index++;
      } else {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    }, stepTime);
  };

  const dispatchLkw = async (destination) => {
    setMessage("");
    try {
      const start = STATIONS.hub;
      const end = STATIONS[destination];
      const osrmRes = await fetch(
  `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
);

      const osrmData = await osrmRes.json();

      if (osrmData.routes && osrmData.routes.length > 0) {
        const coords = osrmData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        setRouteCoords(coords);
        startTruckAnimation(coords);
      } else {
        const fallback = [start, end];
        setRouteCoords(fallback);
        startTruckAnimation(fallback);
      }
    } catch (err) {
      console.error("Не удалось загрузить дорожную карту навигации:", err);
    }

    try {
  const res = await fetch("http://127.0.0.1:8000/api/v1/dispatch",{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cargo_name: cargoName,
          weight_tons: parseFloat(weight),
          destination: destination
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Committed: ${data.message}`);
      } else {
        setMessage(`Error: ${data.detail || "Невалидные данные"}`);
      }
    } catch (err) {
      setMessage("Error: Нет связи с сервером Рендера/Локалхоста");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <h1 className="text-3xl font-bold text-cyan-400 mb-6 border-b border-cyan-800 pb-2">
        Böblingen Logistik-Zentrum 4.0 1793982945549 🚛
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-400 mb-4">Текущий статус LKW:</h2>
            <div className="grid grid-cols-2 gap-4 text-lg">
              <div>Статус: <span className={`font-bold ${lkwStatus.status === 'EN_ROUTE' ? 'text-amber-400 animate-pulse' : lkwStatus.status === 'DELIVERED' ? 'text-emerald-400' : 'text-slate-400'}`}>{lkwStatus.status}</span></div>
              <div>Локация: <span className="text-cyan-300 font-medium text-base">{lkwStatus.location}</span></div>
              <div>Груз: <span className="text-slate-300">{lkwStatus.current_cargo || "—"}</span></div>
              <div>Вес: <span className="text-slate-300">{lkwStatus.weight ? `${lkwStatus.weight} т` : "0 т"}</span></div>
            </div>
          </div>
          {message && <div className="mt-4 p-3 bg-slate-700 text-cyan-300 rounded-lg text-sm font-mono border border-cyan-900 break-words">{message}</div>}
        </div>

        <div className="w-full h-auto min-h-[300px]">
          <MapComponent truckPos={truckPos} routeCoords={routeCoords} />
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-8 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-400 mb-4">Параметры погрузки:</h2>
        <div className="flex gap-4">
          <input type="text" value={cargoName} onChange={(e) => setCargoName(e.target.value)} className="bg-slate-900 border border-slate-700 rounded p-2 text-white w-full" placeholder="Название груза" />
          <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="bg-slate-900 border border-slate-700 rounded p-2 text-white w-32" placeholder="Тонны" />
        </div>
      </div>

      <h2 className="text-xl font-semibold text-slate-400 mb-4">Диспетчерский пульт (Выбор маршрута):</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => dispatchLkw("Mercaden")} disabled={lkwStatus.status === "EN_ROUTE"} className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2">
          Отправить в Mercaden 🛒
        </button>
        <button onClick={() => dispatchLkw("Kaufland")} disabled={lkwStatus.status === "EN_ROUTE"} className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2">
          Отправить в Kaufland 📦
        </button>
        <button onClick={() => dispatchLkw("Diezenhalde")} disabled={lkwStatus.status === "EN_ROUTE"} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2">
          Отправить в Diezenhalde 🏠
        </button>
      </div>
    </div>
  );
}

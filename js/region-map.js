// js/region-map.js

// 1. Настройки центров и масштабов для каждого региона (базовые, но будут переопределены fitBounds)
const regionSettings = {
    'bolshezemelskaya': { lat: 68.0, lng: 57.0, zoom: 7 },
    'malozemelskaya': { lat: 67.5, lng: 50.0, zoom: 7 },
    'kaninskaya': { lat: 67.0, lng: 45.0, zoom: 7 },
    'timanskaya': { lat: 67.0, lng: 52.0, zoom: 7 },
    'poluostrov-kanin': { lat: 68.0, lng: 45.0, zoom: 7 },
    'yugorskiy-poluostrov': { lat: 69.5, lng: 60.0, zoom: 7 },
    'ostrov-vaygach': { lat: 70.0, lng: 59.0, zoom: 7 },
    'ostrov-kolguev': { lat: 69.2, lng: 49.3, zoom: 7 },
    'naryan-mar': { lat: 67.638, lng: 53.007, zoom: 12 } 
};

// 2. Словарь соответствия «regionId → имя в GeoJSON» (обратный тому, что в main-map.js)
const zoneNameMap = {
    'bolshezemelskaya': 'Большеземельская тундра',
    'malozemelskaya': 'Малоземельская тундра',
    'kaninskaya': 'Канинская тундра',
    'timanskaya': 'Тиманская тундра',
    'poluostrov-kanin': 'Полуостров Канин',
    'yugorskiy-poluostrov': 'Югорский полюсторов',
    'ostrov-vaygach': 'Остров Вайгач',
    'ostrov-kolguev': 'Остров Колгуев',
    'naryan-mar': 'Нарьян-Мар'    
};

function initRegionMap(regionId) {
    const center = regionSettings[regionId] || { lat: 67.5, lng: 54.5, zoom: 6 };

    // Инициализация карты с отключённой стандартной атрибуцией
    const map = L.map('region-map', {
        attributionControl: false
    }).setView([center.lat, center.lng], center.zoom);

    // ЕДИНЫЙ СЛОЙ от 2GIS с русскими подписями и отличной детализацией
    L.tileLayer('https://tile2.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1', {
        attribution: '&copy; <a href="https://www.2gis.ru/">2GIS</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Чистая панель копирайта
    const attributionControl = L.control.attribution({
        prefix: false
    }).addTo(map);
    attributionControl.addAttribution('© <a href="https://www.openstreetmap.org/copyright">участники OpenStreetMap</a>');

    // Добавляем маркеры авторов
    addAuthorsToMap(map, regionId);

    // Загружаем GeoJSON и подсвечиваем нужную зону
    fetch('../data/nao-zones.geojson')
        .then(response => response.json())
        .then(data => {
            // Находим фичу с нужным именем (из zoneNameMap)
            const targetName = zoneNameMap[regionId];
            const regionFeature = data.features.find(feature => {
                const rawName = feature.properties.name || feature.properties.Name || '';
                return rawName === targetName;
            });

            if (regionFeature) {
                // Создаём слой для выделенной зоны
                const regionLayer = L.geoJSON(regionFeature, {
                    style: {
                        color: "#ff7800",      // оранжевая граница
                        weight: 4,
                        fill: false,            // ← полностью отключаем заливку
                        opacity: 1
                    }
                }).addTo(map);

                // Автоматически масштабируем карту под границы зоны
                map.fitBounds(regionLayer.getBounds());
            } else {
                console.warn(`Зона "${targetName}" не найдена в GeoJSON`);
            }
        })
        .catch(error => console.error('Ошибка загрузки GeoJSON:', error));
}

function addAuthorsToMap(map, regionId) {
    const authors = window.authorsData.filter(author => author.region === regionId);
    if (authors.length === 0) return;

    // Создаём группу кластеризации
    const markers = L.markerClusterGroup({
        showCoverageOnHover: false,   // не показывать границы кластера при наведении
        maxClusterRadius: 50,         // радиус в пикселях для объединения
        spiderfyOnMaxZoom: true       // при максимальном зуме раскладывать паутинкой
    });

    authors.forEach(author => {
        if (author.lat == null || author.lng == null) return;
        const marker = L.marker([author.lat, author.lng]);
        const popupContent = `
            <div class="author-popup">
                <h3>${author.name}</h3>
                <p>${author.shortBio || ''}</p>
                <a href="../author.html?id=${author.id}" target="_blank">Подробнее</a>
            </div>
        `;
        marker.bindPopup(popupContent);
        markers.addLayer(marker);
    });

    map.addLayer(markers);
}
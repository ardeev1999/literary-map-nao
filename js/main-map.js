// Инициализация карты с центром на НАО
// Ключевой момент: отключаем встроенную панель атрибуции (флаг и надпись Leaflet)
const map = L.map('map', {
    attributionControl: false
}).setView([67.5, 54.5], 6);

// ЕДИНЫЙ СЛОЙ от 2GIS с русскими подписями и отличной детализацией
L.tileLayer('https://tile2.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1', {
    attribution: '&copy; <a href="https://www.2gis.ru/">2GIS</a> contributors',
    maxZoom: 19
}).addTo(map);

// Создаём свою собственную, "чистую" панель для копирайта
const attributionControl = L.control.attribution({
    prefix: false // Убираем префикс 'Leaflet'
}).addTo(map);

// Добавляем в неё только необходимый текст
attributionControl.addAttribution('© <a href="https://www.openstreetmap.org/copyright">участники OpenStreetMap</a>');

// Словарь соответствия названий из GeoJSON -> имя файла (без .html)
const zoneFileMap = {
    'kolguyev_island': 'ostrov-kolguev',
    'kanin_pol': 'poluostrov-kanin',
    'kaninskaya_tundra': 'kaninskaya-tundra',
    'timan_tundra': 'timanskaya-tundra',
    'malozemel_tundra': 'malozemelskaya-tundra',
    'bolshaya_nundra': 'bolshezemelskaya-tundra',
    'ugorskiy_pol': 'yugorskiy-poluostrov',
    'vaygach_island': 'ostrov-vaygach',
    'naryan_mar': 'naryan-mar' 
};

// Загружаем и отображаем зоны тундры
fetch('data/nao-zones.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: function (feature) {
                // Стиль видимого контура (без заливки)
                return {
                    color: "#2c7da0",
                    weight: 2,
                    fill: false,
                    opacity: 1,
                    interactive: false  // события не обрабатываем, только отрисовка
                };
            },
            onEachFeature: function (feature, layer) {
                const rawName = feature.properties.name || feature.properties.Name || '';
                const fileName = zoneFileMap[rawName] || rawName.toLowerCase().replace(/ /g, '-').replace(/[^а-яa-z0-9-]/gi, '');
                const displayName = rawName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                
                // Создаём невидимый полигон для обработки событий
                var hitArea = L.polygon(layer.getLatLngs(), {
                    fill: true,
                    fillOpacity: 0,
                    weight: 0,
                    color: 'transparent',
                    interactive: true,
                    bubblingMouseEvents: false  // предотвращает всплытие событий
                }).addTo(map);
                
                // Подсказка при наведении
                hitArea.bindTooltip(displayName, { permanent: false, direction: 'center' });
                
                // Эффект при наведении – меняем стиль видимого слоя
                hitArea.on('mouseover', function () {
                    layer.setStyle({
                        weight: 3,
                        color: "#ff7800",
                        fill: false,  // заливка не нужна, только контур
                        opacity: 1
                    });
                    layer.bringToFront();
                });
                
                hitArea.on('mouseout', function () {
                    layer.setStyle({
                        weight: 2,
                        color: "#2c7da0",
                        fill: false,
                        opacity: 1
                    });
                });
                
                // Клик – переход на страницу региона
                hitArea.on('click', function () {
                    window.location.href = 'regions/' + fileName + '.html';
                });
                
                // Сохраняем ссылку на hitArea в layer для возможного удаления
                layer._hitArea = hitArea;
            }
        }).addTo(map);
    })
    .catch(error => console.error('Ошибка загрузки GeoJSON:', error));
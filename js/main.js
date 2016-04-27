ymaps.ready(function () {
    var myPlacemark, myMap = new ymaps.Map('map', {
            center: [59.91, 30.30],
            zoom: 10,
            controls: ['smallMapDefaultSet']
         //   behaviors: ['default', 'scrollZoom']
        }, {
            searchControlProvider: 'yandex#search'
        }),
        customItemContentLayout = ymaps.templateLayoutFactory.createClass(
            // Флаг "raw" означает, что данные вставляют "как есть" без экранирования html.
            '<h2 class=ballon_header>{{ properties.balloonContentHeader|raw }}</h2>' +
            '<div class=ballon_body>{{ properties.balloonContentBody|raw }}</div>' +
            '<div class=ballon_footer>{{ properties.balloonContentFooter|raw }}</div>'
        ),
        clusterer = new ymaps.Clusterer({
            clusterDisableClickZoom: true,
            clusterOpenBalloonOnClick: true, // Устанавливаем стандартный макет балуна кластера "Карусель".
            clusterBalloonContentLayout: 'cluster#balloonCarousel', // Устанавливаем собственный макет.
            clusterBalloonItemContentLayout: customItemContentLayout, // Устанавливаем режим открытия балуна.
            // В данном примере балун никогда не будет открываться в режиме панели.
            clusterBalloonPanelMaxMapArea: 0, // Устанавливаем размеры макета контента балуна (в пикселях).
            clusterBalloonContentLayoutWidth: 200,
            clusterBalloonContentLayoutHeight: 130, // Устанавливаем максимальное количество элементов в нижней панели на одной странице
            clusterBalloonPagerSize: 5
                // Настройка внешего вида нижней панели.
                // Режим marker рекомендуется использовать с небольшим количеством элементов.
                // clusterBalloonPagerType: 'marker',
                // Можно отключить зацикливание списка при навигации при помощи боковых стрелок.
                // clusterBalloonCycling: false,
                // Можно отключить отображение меню навигации.
                // clusterBalloonPagerVisible: false
        })
    
        /**
         * Функция возвращает объект, содержащий опции метки.
         * Все опции, которые поддерживают геообъекты, можно посмотреть в документации.
         * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/GeoObject.xml
         */
        getPointOptions = function () {
            return {
                preset: 'islands#violetIcon'
            };
        },
        geoObjects = [];


    /**
     * В кластеризатор можно добавить javascript-массив меток (не геоколлекцию) или одну метку.
     * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/Clusterer.xml#add
     */
    clusterer.add(geoObjects);
    myMap.geoObjects.add(clusterer);

    // Слушаем клик на карте
    myMap.events.add('click', function (e) {
        var coords = e.get('coords'),
            address = getAddress(coords);

        address.then(function (gotAddress) {
            console.log(gotAddress.properties.get('text'));
            var name = prompt('имя');
            var place = prompt('место');
            var text = prompt('отзыв');

            placeMarkToMap(coords, gotAddress.properties.get('text'), name, place, text);

            var xhr = new XMLHttpRequest();
            xhr.open('post', 'http://localhost:3000/', true);
            xhr.onloadend = function () {
                console.log(xhr.response); // Функция, которая добавляет отзыв в список отзывов этой точки
            }
            xhr.send(JSON.stringify({
                op: 'add',
                review: {
                    coords: {
                        x: coords[0],
                        y: coords[1]
                    },
                    address: gotAddress.properties.get('text'),
                    name: name,
                    place: place,
                    text: text
                }
            }))

        })
    });

    function placeMarkToMap(coords, address, name, place, text) {
        myPlacemark = createPlacemark(coords);
        myPlacemark.properties
            .set({
                balloonContentHeader: place,
                balloonContentBody: text,
                balloonContentFooter: name
            });
        clusterer.add(myPlacemark);
    }

    // Создание метки
    function createPlacemark(coords) {
        return new ymaps.Placemark(coords, {}, {
            preset: 'islands#violetStretchyIcon',
        });
    }

    // Определяем адрес по координатам (обратное геокодирование)
    function getAddress(coords) {
        return ymaps.geocode(coords).then(function (res) {
            return res.geoObjects.get(0);
        });
    }

    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.open('post', 'http://localhost:3000/', true);
    xhr.onload = function () {
        console.log(xhr.response);
        for (var address in xhr.response) {
            var reviews = xhr.response[address];
            reviews.forEach(function (review) {
                placeMarkToMap([review.coords.x, review.coords.y], address, review.name, review.place, review.text)
            })
        }
    }
    xhr.send(JSON.stringify({
        op: 'all'
    }));


});
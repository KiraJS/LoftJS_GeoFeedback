ymaps.ready(function () {
    var myPlacemark,
        name,
        text,
        place,
        reviewInner = document.getElementById('review'),
        closeBtn = document.getElementById('closeBtn'),
        button = document.getElementById('button'),
        popup = document.getElementById('popup'),
        header = document.getElementById('header'),
        nameInput = document.getElementById('name'),
        placeInput = document.getElementById('place'),
        textInput = document.getElementById('text'),
        myMap = new ymaps.Map('map', {
            center: [59.91, 30.30],
            zoom: 10,
            controls: ['smallMapDefaultSet']
        }, {
            searchControlProvider: 'yandex#search'
        }),
        customItemContentLayout = ymaps.templateLayoutFactory.createClass(
            '<h2 class=ballon_header>{{ properties.balloonContentHeader|raw }}</h2>' +
            '<div class=ballon_body>{{ properties.balloonContentBody|raw }}</div>' +
            '<div class=ballon_footer>{{ properties.balloonContentFooter|raw }}</div>'
        ),
        clusterer = new ymaps.Clusterer({

            clusterDisableClickZoom: true,
            clusterOpenBalloonOnClick: true,
            clusterBalloonContentLayout: 'cluster#balloonCarousel',
            clusterBalloonItemContentLayout: customItemContentLayout,
            clusterBalloonPanelMaxMapArea: 0,
            clusterBalloonContentLayoutWidth: 200,
            clusterBalloonContentLayoutHeight: 130,
            clusterBalloonPagerSize: 5

        })
    getPointOptions = function () {
            return {
                preset: 'islands#violetIcon'
            };
        },
        geoObjects = [];
    clusterer.add(geoObjects);
    myMap.geoObjects.add(clusterer);

    // Слушаем клик на карте
    myMap.events.add('click', function (e) {
        var coords = e.get('coords'),
            address = getAddress(coords);

        address.then(function (gotAddress) {
            var currentAddress = gotAddress.properties.get('text');
            showPopup(currentAddress);
            removeReviews();

            var xhr = new XMLHttpRequest();
            xhr.responseType = 'json';
            xhr.open('post', 'http://localhost:3000/', true);
            xhr.onload = function () {
                for (var address in xhr.response) {
                    var reviews = xhr.response[address];
                    reviews.forEach(function (review) {
                        if (review.address == currentAddress) {
                            var newReview = document.createElement('div');
                            var newReviewName = document.createElement('span');
                            var newReviewPlace = document.createElement('span');
                            var newReviewText = document.createElement('p');
                            var newReviewDate = document.createElement('span');
                            newReview.className = "review__item";
                            newReviewName.className = "review__author";
                            newReviewName.innerHTML = review.name;
                            newReviewPlace.className = "review__place";
                            newReviewPlace.innerHTML = review.place;
                            newReviewText.className = "review__text";
                            newReviewText.innerHTML = review.text;
                            newReviewDate.className = "review__date";
                            newReviewDate.innerHTML = new Date(review.date).toDateString();
                            reviewInner.appendChild(newReview);
                            newReview.appendChild(newReviewName);
                            newReview.appendChild(newReviewPlace);
                            newReview.appendChild(newReviewText);
                            newReview.appendChild(newReviewDate);
                        }
                    })
                }

            }
            xhr.send(JSON.stringify({
                op: 'all'
            }));

            button.onclick = function saveNewReview() {
                name = nameInput.value;
                place = placeInput.value;
                text = textInput.value;
                placeMarkToMap(coords, gotAddress.properties.get('text'), name, place, text);
                closePopup();
                resetValues();

                var xhr = new XMLHttpRequest();
                xhr.open('post', 'http://localhost:3000/', true);
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
            }

        })
    });
    closeBtn.onclick = function () {
        closePopup();
    }

    function removeReviews() {
        console.log(reviewInner.children.length)
        while (reviewInner.childNodes[0]) {
            reviewInner.removeChild(reviewInner.childNodes[0]);
        }
    }

    function closePopup() {
        popup.style.display = "none";
    }

    function resetValues() {
        nameInput.value = "";
        placeInput.value = "";
        textInput.value = "";
    }

    function showPopup(address) {
        popup.style.display = "block";
        header.innerHTML = address;
    }

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
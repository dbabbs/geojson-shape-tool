const $ = (q) => document.querySelector(q);
const $$ = (qq) => Array.from(document.querySelectorAll(qq));

const hereCredentials = {
   id: 'UQ75LhFcnAv0DtOUwBEA',
   code: 'f5nyezNmYF4wvuJqQgNSkg'
}

const hereTileUrl = `https://2.base.maps.api.here.com/maptile/2.1/maptile/newest/reduced.night/{z}/{x}/{y}/512/png8?app_id=${hereCredentials.id}&app_code=${hereCredentials.code}&ppi=320`;

const map = L.map('map', {
   center: [30, -50],
   zoom: 2,
   layers: [L.tileLayer(hereTileUrl)],
   zoomControl: false
});

function makeGeoCodeUrl(query) {
   return `https://geocoder.api.here.com/6.2/geocode.json?app_id=${hereCredentials.id}&app_code=${hereCredentials.code}&searchtext=${query}`;
}

function makeShapeGeocodeUrl(location, level) {
   return `https://reverse.geocoder.api.here.com/6.2/reversegeocode.json?app_id=${hereCredentials.id}&app_code=${hereCredentials.code}&mode=retrieveAddresses&maxresults=1&additionaldata=IncludeShapeLevel%2C${level}&prox=${location.Latitude},${location.Longitude}`
}

$('#go').onclick = () => {
   clearMap();
   $('lui-spinner').style.display = 'block';
   fetch(makeGeoCodeUrl($('#location').value)).then(geocodeRes => geocodeRes.json()).then(geocodeRes => {

      const coordinates = geocodeRes.Response.View[0].Result[0].Location.NavigationPosition[0];
      const level = $('#level input:checked').value;

      fetch(makeShapeGeocodeUrl(coordinates, level)).then(shapeRes => shapeRes.json()).then(shapeRes => {
         const raw = shapeRes.Response.View[0].Result[0].Location.Shape.Value;
         const geojson = Terraformer.WKT.parse(raw);

         const geoJsonLayer = L.geoJSON(geojson, {
            style: {
               color: '#2DD5C9'
            }
         }).addTo(map);

         map.fitBounds(geoJsonLayer.getBounds());

         $('lui-spinner').style.display = 'none';
         $('#download').style.display = 'inline-block'
         $('#download').onclick = () => {
            download(geojson, `${$('#location').value}.geojson`)
         }
      })
   })
}

function download(file, fileName) {
   const element = document.createElement('a');
   element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(file)));
   element.setAttribute('download', fileName);
   element.style.display = 'none';
   document.body.appendChild(element);
   element.click();
   document.body.removeChild(element);
}

function clearMap() {
   map.eachLayer((layer) => {
      if (!layer.hasOwnProperty('id') && layer._url != hereTileUrl) {
         map.removeLayer(layer);
      }
   });
}

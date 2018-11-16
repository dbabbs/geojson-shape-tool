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
         const location = shapeRes.Response.View[0].Result[0].Location.Address;
         const geojson = {
            type: 'Feature',
            geometry: Terraformer.WKT.parse(raw),
            properties: {}
         }
         if (level == 'country') {
            geojson.properties = {
               admin_region: level,
               country: location.Country
            }
         } else if (level == 'state') {
            geojson.properties = {
               admin_region: level,
               country: location.Country,
               state: location.State
            }
         } else if (level == 'county') {
            geojson.properties = {
               admin_region: level,
               country: location.Country,
               state: location.State,
               county: location.County
            }
         } else if (level == 'county') {
            geojson.properties = {
               admin_region: level,
               country: location.Country,
               state: location.State,
               county: location.County
            }
         } else if (level == 'city') {
            geojson.properties = {
               admin_region: level,
               country: location.Country,
               state: location.State,
               county: location.County,
               city: location.City
            }
         } else if (level == 'district') {
            geojson.properties = {
               admin_region: level,
               country: location.Country,
               state: location.State,
               county: location.County,
               city: location.City,
               district: location.District
            }
         } else if (level == 'postalCode') {
            geojson.properties = {
               admin_region: level,
               country: location.Country,
               state: location.State,
               county: location.County,
               city: location.City,
               district: location.District,
               postal_code: location.PostalCode
            }
         }
         const geoJsonLayer = L.geoJSON(geojson, {
            style: {
               color: '#2DD5C9'
            }
         }).addTo(map);

         map.fitBounds(geoJsonLayer.getBounds());

         $('lui-spinner').style.display = 'none';
         $('#download').style.display = 'inline-block'
         $('.hide').style.display = 'block';
         $('#download').onclick = () => {
            download(geojson, `${$('#location').value}.geojson`)
         }
         const id = randomId();
         console.log(geojson)
         $('#xyz').onclick = () => {
            geojson.id = id;
            const xyzToken = $('#xyz-token').value;
            const xyzId = $('#xyz-space').value
            $('lui-spinner').style.display = 'block';
            fetch(`https://xyz.api.here.com/hub/spaces/${xyzId}/features/${id}`, {
               method: "PUT",
               headers: {
                  'accept': 'application/geo+json',
                  'Authorization': `Bearer ${xyzToken}`,
                  'Content-Type': 'application/geo+json',
               },
               body: JSON.stringify(geojson), // body data type must match "Content-Type" header
            }).then(res => {
               $('#xyz-view').style.display = 'block';
               $('#xyz-view').href = `http://geojson.tools/index.html?url=https://xyz.api.here.com/hub/spaces/${xyzId}/search?limit=5000&access_token=${xyzToken}`
               $('lui-spinner').style.display = 'none';
               console.log(res)
            }).catch(error => {
               console.log(error);
            })

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

function randomId() {
   return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

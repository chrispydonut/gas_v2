import React, { useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet } from 'react-native';

type Props = {
  onMapTouch: (lat: number, lng: number) => void;
  marker?: { lat: number; lng: number };
};

export default function KakaoMapView({ onMapTouch, marker }: Props) {
    const webRef = useRef<WebView>(null);
  
    useEffect(() => {
      if (marker && webRef.current) {
        const msg = JSON.stringify({ type: 'SET_MARKER', lat: marker.lat, lng: marker.lng });
        webRef.current.postMessage(msg);
      }
    }, [marker]);

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>KakaoMap</title>
    <style>
      html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
    </style>
    <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=4ad19c3f7d84573a0f9f71474e751e88&autoload=false"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      kakao.maps.load(function () {
        const mapContainer = document.getElementById('map');
        const map = new kakao.maps.Map(mapContainer, {
          center: new kakao.maps.LatLng(37.5665, 126.9780),
          level: 3,
        });

        let marker = null;

        window.addEventListener("message", function(e) {
          const msg = JSON.parse(e.data);
          if (msg.type === "SET_MARKER") {
            const latlng = new kakao.maps.LatLng(msg.lat, msg.lng);
            if (!marker) {
              marker = new kakao.maps.Marker({ position: latlng });
              marker.setMap(map);
            } else {
              marker.setPosition(latlng);
            }
            map.setCenter(latlng);
          }
        });

        kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
          const latlng = mouseEvent.latLng;
          if (!marker) {
            marker = new kakao.maps.Marker({ position: latlng });
            marker.setMap(map);
          } else {
            marker.setPosition(latlng);
          }
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "MAP_CLICKED",
            lat: latlng.getLat(),
            lng: latlng.getLng()
          }));
        });
      });
    </script>
  </body>
</html>
`;

  return (
    <WebView
      ref={webRef}
      originWhitelist={['*']}
      source={{ html }}
      style={styles.map}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      mixedContentMode="always"
      onMessage={(event) => {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'MAP_CLICKED') {
          onMapTouch(msg.lat, msg.lng);
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

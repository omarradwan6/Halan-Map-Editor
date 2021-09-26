import * as jsts from "jsts/dist/jsts";

const google = window.google;

const createJstsPolygon = (geometryFactory, polygon) => {
  try {
    var path = polygon.getPath();
    var coordinates = path.getArray().map(function name(coord) {
      return new jsts.geom.Coordinate(coord.lat(), coord.lng());
    });
    coordinates.push(coordinates[0]);
    var shell = geometryFactory.createLinearRing(coordinates);
    return geometryFactory.createPolygon(shell);
  } catch (e) {
    console.log(e);
  }
};

const drawIntersectionArea = (map, polygon) => {
  try {
    var coords = polygon.getCoordinates().map(function (coord) {
      return { lat: coord.x, lng: coord.y };
    });

    if (coords.length !== 0) {
      return true;
    }

    return false;
  } catch (e) {
    console.log(e);
    return false;
  }
};


// checking intersection between zone and already created zones on map.
export const checkIntersection = (zone, createdZones, map) => {
  let geometryFactory = new jsts.geom.GeometryFactory();
  let newZoneJst = createJstsPolygon(geometryFactory, zone);
  let clashed = false;

  console.log(createdZones,"ininttt")

  createdZones.forEach((points) => {
    try {
      let createdZone = new google.maps.Polygon({ paths: points });
      let anotherPolygon = createJstsPolygon(geometryFactory, createdZone);
      var intersection = newZoneJst.intersection(anotherPolygon);
    } catch (e) {
      console.log(e);
    }

    if (drawIntersectionArea(map, intersection)) {
      clashed = true;
    }
  });

  return clashed;
};

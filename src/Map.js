import React from "react";
import { checkIntersection } from "./Functions/checkIntersection";
import { createDrawingManager } from "./Functions/createDrawingManager";
import {
  getZones,
  createZone,
  deleteZone,
  updateZone,
} from "./Functions/apiRequests";
import { deletePoints } from "./Functions/deletePoints";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDrawPolygon,
  faEdit,
  faTrashAlt,
  faUndo,
  faFileDownload,
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "./navbar";
import ClipLoader from "react-spinners/ClipLoader";
import "./styling.css";
import { CSVLink } from "react-csv";

const google = window.google;

class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentZone: null,
      selectedZone: null,
      zoneColor: "",
      zoneName: "",
      drawZone: false,
      zonesPaths: [],
      selectedZoneID: null,
      selectedZonePoints: null,
      selectedInfoWindow: null,
      loading: false,
      savedZones: [],
    };

    this.drawZone = this.drawZone.bind(this);
    this.getZones = this.getZones.bind(this);
    this.cancelDrawing = this.cancelDrawing.bind(this);
    this.deleteZone = this.deleteZone.bind(this);
    this.getZone = this.getZone.bind(this);
    this.updateZone = this.updateZone.bind(this);
    this.downloadZones = this.downloadZones.bind(this);
    this.createPolygon = this.createPolygon.bind(this);
  }

  componentDidMount() {
    // create google map instance and refer it to div with ref 'map'.
    this.map = new google.maps.Map(this.refs.map, {
      center: { lat: 30.0609, lng: 31.2197 },
      zoom: 8,
    });

    // add rightclick event listener on map to deselect zone and close infowindow if opened.
    this.map.addListener("rightclick", () => {
      if (this.state.selectedInfoWindow) {
        this.state.selectedInfoWindow.close(this.map);
      }

      this.setState({
        selectedZone: null,
        selectedZonePoints: null,
        selectedZoneID: null,
        selectedInfoWindow: null,
        zoneName: "",
        zoneColor: "",
      });
    });

    // add click event listener on map to deselect zone and close infowindow if opened.
    this.map.addListener("click", () => {
      if (this.state.selectedInfoWindow) {
        this.state.selectedInfoWindow.close(this.map);
      }
      this.setState({
        selectedZone: null,
        selectedZonePoints: null,
        selectedZoneID: null,
        selectedInfoWindow: null,
        zoneName: "",
        zoneColor: "",
      });
    });

    //create drawing layer to enable drawing polygons on map then drawing existing zones from database.
    this.drawingManager = createDrawingManager();
    this.getZones();
  }

  // get zones from database then drawing them on map.
  async getZones() {
    try {
      let response = await getZones();
      var zones = response.data.data;
console.log(response)
      //looping over zones and converting lat and lng to float to be able to draw on map.
      zones.forEach((zoneObject) => {
        let points = zoneObject.points;
        let newPoints = points.map((a) => {
          return { lat: parseFloat(a.lat), lng: parseFloat(a.lng) };
        });
        zoneObject.points = newPoints;
      });

      // looping over zones and creating polygons for each zone and adding them to map.
      zones.forEach((zone) => {
        this.createPolygon(zone);
      });
    } catch (error) {
      console.log(error);
    }

    this.downloadZones();
  }

  // create Polygon with data retrieved from database.
  createPolygon(zone) {
    let zonesPaths = this.state.zonesPaths;

    let polygon = new google.maps.Polygon({
      paths: zone.points,
      strokeWeight: 1,
      fillColor: zone.color,
      fillOpacity: 0.35,
    });
    // add zone points to zonepaths array.
    zonesPaths.push(zone.points);

    //create infowindow for polygon with content of zone's name.
    let infowindow = new google.maps.InfoWindow({
      content: zone.label,
    });

    // create click event listener that shows the toggles the infowindow and selects the polygon.
    polygon.addListener("click", (e) => {
      if (this.state.selectedInfoWindow) {
        this.state.selectedInfoWindow.close(this.map);
      }
      infowindow.setPosition(e.latLng);
      infowindow.open(this.map);

      this.setState({
        selectedZone: polygon,
        selectedZoneID: zone._id,
        selectedZonePoints: zone.points,
        zoneName: zone.label,
        zoneColor: zone.color,
        selectedInfoWindow: infowindow,
      });
    });
    
    this.setState({ zonesPaths });
    polygon.setMap(this.map);
  }

  // redraw a specific zone.
  async getZone(zoneName) {
    try {
      let response = await getZones();
      var zones = response.data.data;

      //draw zone
      zones.forEach((zoneObject) => {
        if (zoneObject.label === zoneName) {
          let points = zoneObject.points;
          let newPoints = points.map((a) => {
            return { lat: parseFloat(a.lat), lng: parseFloat(a.lng) };
          });
          zoneObject.points = newPoints;
        }
      });

      zones.forEach((zone) => {
        if (zone.label === zoneName) {
          this.createPolygon(zone);


          this.setState({
            selectedZone: null,
            selectedZoneID: null,
            selectedZonePoints: null,
            zoneName: "",
            zoneColor: "",
          });
        }
      });
    } catch (error) {
      console.log(error);
    }

    this.downloadZones();
  }

  // draw zone on map.
  drawZone(e) {
    e.preventDefault();
    // drawing is only enabled when color and name are filled.
    if (this.state.zoneColor && this.state.zoneName) {
      this.setState({ drawZone: true });

      //open drawing layer
      this.drawingManager.setMap(this.map);
      // an event listener to listen when a polygon is completed.
      google.maps.event.addListener(
        this.drawingManager,
        "polygoncomplete",
        async (polygon) => {
          const coords = polygon
            .getPath()
            .getArray()
            .map((coord) => {
              return {
                lat: coord.lat(),
                lng: coord.lng(),
              };
            });

          polygon.setOptions({ fillColor: this.state.zoneColor });

          // checking if new polygon intersects with previous drawn polygons.
          if (!checkIntersection(polygon, this.state.zonesPaths, this.map)) {
            try {
              await this.setState({ loading: true });
              let response = await createZone(
                this.state.zoneName,
                this.state.zoneColor,
                coords
              );
              this.setState({ loading: false });
            } catch (error) {
              console.log(e);
              this.setState({ loading: false });
              alert("Zone creation failed. Zone name may be already used.");
            }
          } else {
            alert("Zone intersects with previously created zone.");
            polygon.setMap(null);
          }

          // removing drawing layer
          this.drawingManager.setMap(null);
          this.drawingManager = createDrawingManager();

          // removing the polygon and redrawing it from database to get the id and enable editing and deleting.
          await this.getZone(this.state.zoneName);
          polygon.setMap(null);
          this.setState({ drawZone: false, zoneName: "", zoneColor: "" });
        }
      );
    } else {
      alert("Please fill zone name and color before drawing.");
    }
  }

  // enabling cancelling mid drawing process.
  cancelDrawing(e) {
    e.preventDefault();
    this.drawingManager.setMap(null);
    this.drawingManager = createDrawingManager();
    this.setState({ zoneColor: "", zoneName: "", drawZone: false });
  }

  // delete selected zone.
  async deleteZone(e) {
    e.preventDefault();

    // getting selected zone data
    let polygon = this.state.selectedZone;
    let polygonID = this.state.selectedZoneID;
    let polygonPoints = this.state.selectedZonePoints;
    let zonesPaths = this.state.zonesPaths;

    try {
      await this.setState({ loading: true });
      let response = await deleteZone(polygonID);
      //deleting zone's points from points array.
      let newZonesPaths = deletePoints(zonesPaths, polygonPoints);

      this.setState({ loading: false });
      polygon.setMap(null);

      // closing zone's infowindow if opened.
      if (this.state.selectedInfoWindow) {
        this.state.selectedInfoWindow.close(this.map);
      }

      //deselecting the zone.
      this.setState({
        selectedZone: null,
        selectedZoneID: null,
        selectedZonePoints: null,
        zonesPaths: newZonesPaths,
        zoneName: "",
        zoneColor: "",
      });
    } catch (error) {
      console.log(error);
      this.setState({ loading: false });
      alert("Zone deletion failed.");
    }

    this.downloadZones();
  }

  // editing selected zone.
  async updateZone(e) {
    e.preventDefault();

    //getting selected zone's data.
    let polygonPoints = this.state.selectedZonePoints;
    let polygon = this.state.selectedZone;
    let polygonID = this.state.selectedZoneID;
    let zoneName = this.state.zoneName;
    let zoneColor = this.state.zoneColor;

    try {
      await this.setState({ loading: true });
      let response = await updateZone(
        polygonID,
        zoneName,
        zoneColor,
        polygonPoints
      );
      this.setState({ loading: false });

      //removing drawing layer.
      this.drawingManager.setMap(null);
      this.drawingManager = createDrawingManager();
      // removing the polygon and redrawing it from database to get the id and enable editing and deleting.
      await this.getZone(zoneName);
      polygon.setMap(null);

      // closing zone's infowindow if opened and deselecting the zone.
      if (this.state.selectedInfoWindow) {
        this.state.selectedInfoWindow.close(this.map);
      }

      this.setState({
        selectedZone: null,
        selectedZoneID: null,
        selectedZonePoints: null,
        selectedInfoWindow: null,
        zoneName: "",
        zoneColor: "",
      });
    } catch (error) {
      console.log(error);
      this.setState({ loading: false });
      alert("Zone editing failed.");
    }
    this.downloadZones();
  }

  // prepare zones data for data export.
  async downloadZones() {
    let response = await getZones();

    let zones = response.data.data;

    // create pointstring that includes all points per zone to be exported to csv.
    zones.forEach((zone) => {
      let pointString = "";
      zone.points.forEach((point) => {
        pointString = `${pointString} [Lat:${point.lat}, Lng:${point.lng} ]`;
      });
      zone.points = pointString;
    });

    this.setState({ savedZones: zones });
  }

  render() {
    const mapStyle = {
      margin: 0,
      height: "80vh",
      color: "black",
    };

    return (
      <div className="container-fluid">
        <Navbar />
        <div id="loader">
          <ClipLoader color="black" loading={this.state.loading} size={100} />
        </div>
        <div className="d-flex justify-content-center align-items-center">
          <form className="row align-items-center m-3 justify-content-center">
            <div className="d-flex flex-row justify-content-center">
              <div style={{ width: "100%" }} className="mx-1">
                <input
                  id="textBox"
                  type="text"
                  className="form-control"
                  placeholder="Zone Name"
                  value={this.state.zoneName}
                  onChange={(e) => this.setState({ zoneName: e.target.value })}
                  required
                />
              </div>
              <div className="mx-1" style={{ width: "2rem" }}>
                <input
                  type="color"
                  className="form-control form-control-color"
                  id="colorPicker"
                  value={this.state.zoneColor}
                  onChange={(e) => this.setState({ zoneColor: e.target.value })}
                  title="Choose your color"
                  required
                />
              </div>
            </div>

            <div className="col-auto mt-3">
              <button
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Draw New Zone"
                className={`btn mapButtons ${
                  this.state.drawZone || this.state.loading ? "disabled" : ""
                }`}
                onClick={this.drawZone}
              >
                <FontAwesomeIcon icon={faDrawPolygon} />
              </button>
            </div>
            <div className="col-auto mt-3">
              <button
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Cancel Drawing process"
                className={`btn mapButtons ${
                  !this.state.drawZone || this.state.loading ? "disabled" : ""
                }`}
                onClick={this.cancelDrawing}
              >
                <FontAwesomeIcon icon={faUndo} />
                {this.state.drawZone ? " Cancel" : ""}
              </button>
            </div>

            <div className="col-auto mt-3">
              <button
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Edit Zone"
                className={`btn mapButtons ${
                  !this.state.selectedZone || this.state.loading
                    ? "disabled"
                    : ""
                }`}
                onClick={this.updateZone}
              >
                <FontAwesomeIcon icon={faEdit} />
              </button>
            </div>
            <div className="col-auto mt-3">
              <button
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Delete Zone"
                className={`btn mapButtons ${
                  !this.state.selectedZone || this.state.loading
                    ? "disabled"
                    : ""
                }`}
                onClick={this.deleteZone}
              >
                <FontAwesomeIcon icon={faTrashAlt} />
              </button>
            </div>
            <div className="col-auto mt-3">
              <CSVLink
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Download Zones Data"
                className={`btn mapButtons ${
                  this.state.loading ? "disabled" : ""
                }`}
                data={this.state.savedZones}
                filename="Zones.csv"
              >
                <FontAwesomeIcon icon={faFileDownload} />
              </CSVLink>
            </div>
          </form>
        </div>
        <div ref="map" style={mapStyle}></div>
      </div>
    );
  }
}

export default Map;

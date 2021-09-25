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
  }

  componentDidMount() {
    this.map = new google.maps.Map(this.refs.map, {
      center: { lat: 30.0609, lng: 31.2197 },
      zoom: 8,
    });

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
    this.drawingManager = createDrawingManager();
    this.getZones();
  }

  async getZones() {
    let zonesPaths = this.state.zonesPaths;
    try {
      let response = await getZones();
      var zones = response.data.data;
      zones.forEach((zoneObject) => {
        let points = zoneObject.points;
        let newPoints = points.map((a) => {
          return { lat: parseFloat(a.lat), lng: parseFloat(a.lng) };
        });
        zoneObject.points = newPoints;
      });

      zones.forEach((zone) => {
        let polygon = new google.maps.Polygon({
          paths: zone.points,
          strokeWeight: 1,
          fillColor: zone.color,
          fillOpacity: 0.35,
        });
        zonesPaths.push(zone.points);

        let infowindow = new google.maps.InfoWindow({
          content: zone.label,
        });

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
        polygon.setMap(this.map);
      });
    } catch (error) {
      console.log(error);
    }

    this.setState({ zonesPaths });
    this.downloadZones()
  }

  async getZone(zoneName) {
    let zonesPaths = this.state.zonesPaths;

    try {
      let response = await getZones();
      var zones = response.data.data;
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
          let polygon = new google.maps.Polygon({
            paths: zone.points,
            strokeWeight: 1,
            fillColor: zone.color,
            fillOpacity: 0.35,
          });

          let infowindow = new google.maps.InfoWindow({
            content: zone.label,
          });
          zonesPaths.push(zone.points);

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
              selectedInfoWindow: infowindow,
              zoneName: zone.label,
              zoneColor: zone.color,
            });
          });

          this.setState({
            selectedZone: null,
            selectedZoneID: null,
            selectedZonePoints: null,
            zoneName: "",
            zoneColor: "",
          });
          polygon.setMap(this.map);
        }
      });
    } catch (error) {
      console.log(error);
    }

    this.setState({ zonesPaths});
    this.downloadZones()
  }

  drawZone(e) {
    e.preventDefault();
    if (this.state.zoneColor && this.state.zoneName) {
      this.setState({ drawZone: true });
      this.drawingManager.setMap(this.map);

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
            }
          } else {
            alert("Zone intersects with previously created zone.");
            polygon.setMap(null);
          }
          this.drawingManager.setMap(null);
          this.drawingManager = createDrawingManager();
          await this.getZone(this.state.zoneName);
          polygon.setMap(null);
          this.setState({ drawZone: false, zoneName: "", zoneColor: "" });
        }
      );
    } else {
      alert("Please fill zone name and color before drawing.");
    }
  }

  cancelDrawing(e) {
    e.preventDefault();
    this.drawingManager.setMap(null);
    this.drawingManager = createDrawingManager();
    this.setState({ zoneColor: "", zoneName: "", drawZone: false });
  }

  async deleteZone(e) {
    e.preventDefault();
    let polygon = this.state.selectedZone;
    let polygonID = this.state.selectedZoneID;
    let polygonPoints = this.state.selectedZonePoints;
    let zonesPaths = this.state.zonesPaths;

    try {
      await this.setState({ loading: true });
      let response = await deleteZone(polygonID);
      this.setState({ loading: false });
      polygon.setMap(null);
      if (this.state.selectedInfoWindow) {
        this.state.selectedInfoWindow.close(this.map);
      }
      let newZonesPaths = deletePoints(zonesPaths, polygonPoints);
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
    }

    this.downloadZones();
  }

  async updateZone(e) {
    e.preventDefault();
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

      this.drawingManager.setMap(null);
      this.drawingManager = createDrawingManager();
      await this.getZone(zoneName);
      polygon.setMap(null);

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
    }
    this.downloadZones();
  }

  async downloadZones() {
    let response = await getZones();

    let zones = response.data.data;

    zones.forEach((zone) => {
      let pointString=""
      console.log(zone,"zzzzzzzzz")
    zone.points.forEach((point) => {
        console.log(point,"Assasa")
        pointString=`${pointString} [Lat:${point.lat}, Lng:${point.lng} ]`

      });
      zone.points=pointString
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
                  this.state.drawZone || this.state.loading  ? "disabled" : ""
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
                  !this.state.drawZone || this.state.loading  ? "disabled" : ""
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
                  !this.state.selectedZone || this.state.loading  ? "disabled" : ""
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
                  !this.state.selectedZone || this.state.loading ? "disabled" : ""
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
                className={`btn mapButtons ${this.state.loading ? "disabled":""}`}
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

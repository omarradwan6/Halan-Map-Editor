import axios from "axios";
import { baseURL } from "./apiConfig";

// api requests and returning the response.

export function login(username, password) {
  let response = axios.post(`${baseURL}/login`, { username, password });
console.log(response,"rssss")
  return response;
}

export function getZones() {
  let response = axios.get(`${baseURL}/zones`, {
    headers: { Authorization: `Bearer ${localStorage.token}` },
  });

  return response;
}

export function createZone(zoneName, zoneColor, coords) {
  let response = axios.post(
    `${baseURL}/zones`,
    {
      label: zoneName,
      color: zoneColor,
      points: coords,
    },
    { headers: { Authorization: `Bearer ${localStorage.token}` } }
  );
console.log(response,"el responssse")
  return response;
}

export function deleteZone(polygonID) {
  let response = axios.delete(`${baseURL}/zones/${polygonID}`, {
    headers: { Authorization: `Bearer ${localStorage.token}` },
  });

  return response;
}

export function updateZone(polygonID, zoneName, zoneColor, zonePoints) {
  let response = axios.put(
    `${baseURL}/zones/${polygonID}`,
    {
      label: zoneName,
      color: zoneColor,
      points: zonePoints,
    },
    { headers: { Authorization: `Bearer ${localStorage.token}` } }
  );
  return response;
}

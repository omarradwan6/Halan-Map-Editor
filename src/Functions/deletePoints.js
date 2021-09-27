
// delete polygon points from zonespaths array.
export function deletePoints(zonesPaths, polygonPoints) {


  let newPaths = zonesPaths.filter((path) => {
    return  path[0].lat !== polygonPoints[0].lat
  });
  
  return newPaths;
}

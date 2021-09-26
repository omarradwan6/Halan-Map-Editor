
// delete polygon points from zonespaths array.
export function deletePoints(zonesPaths, polygonPoints) {

  let newPaths = zonesPaths.filter((path) => {
    console.log(path!==polygonPoints,path,polygonPoints,"compaaaree")
    return path!==polygonPoints    
  });
console.log(newPaths,zonesPaths,"lllllllllllll")
  return newPaths;
}

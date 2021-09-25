export function deletePoints(zonesPaths, polygonPoints) {

  let newPaths = zonesPaths.filter((path) => {
    return path!==polygonPoints

    
  });

  return newPaths;
}

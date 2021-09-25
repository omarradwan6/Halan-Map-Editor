const google=window.google


export function createDrawingManager(){

      const drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: false,
        drawingControlOptions: {
          drawingModes: [google.maps.drawing.OverlayType.POLYGON],
        },polygonOptions:{
          clickable:true,
          strokeWeight:1  
        }
  
      });

      return drawingManager
}


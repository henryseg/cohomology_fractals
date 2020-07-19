//-------------------------------------------------------
// UI Variables
//-------------------------------------------------------

var guiInfo;
var triangFolder;
var surfaceController = [0,0,0,0,0,0,0,0]; // dummy variables
var geometryController;
var triangulationController;
var triangulationDict;
var fovController;
var capturer;

// Inputs are from the UI parameterizations.
// gI is the guiInfo object from initGui

var sendGluingData = function(){
  g_material.uniforms.planes.value = planes;  
  g_material.uniforms.otherTetNums.value = other_tet_nums;
  g_material.uniforms.entering_face_nums.value = entering_face_nums;
  g_material.uniforms.SO31tsfms.value = SO31tsfms;
}

var sendWeights = function(){
  g_material.uniforms.weights.value = weights;
}

var resetPosition = function(){
  g_tet_num = 0;
  g_material.uniforms.tetNum.value = g_tet_num;
  g_currentWeight = 0.0;
  g_material.uniforms.currentWeight.value = g_currentWeight;
  g_currentBoost.identity();
  // g_currentBoost.makeRotationX(Math.PI/2.0);
  g_controllerBoosts[0].identity();
}

var setUpTriangDict = function(){
  var triangulationKeys = Object.keys(g_census_data[g_census_index]);
  triangulationKeys.sort();
  triangulationDict = {};
  for (var i = 0; i < triangulationKeys.length; i++) {
    triangulationDict[triangulationKeys[i]] = triangulationKeys[i];
  };
}

var stripFillingInfo = function(s){
    var n = s.indexOf('_(');
    return s.substring(0, n != -1 ? n : s.length);
}

var setUpSurfaceController = function(i){
  surfaceController[i] = triangFolder.add(guiInfo, 'surfaceCoeffs'.concat(i.toString()), -1.0,1.0,0.1).name(g_weightsBasis[i]);
  surfaceController[i].onChange(function(value){  
    g_surfaceCoeffs[i] = value;
    setUpSurface(guiInfo.triangulation, g_surfaceCoeffs);
    sendWeights();
  });
}

var setUpSurfaceControllers = function(){
  var j;
  for(j=0;j<g_weightsBasis.length;j++){ 
    setUpSurfaceController(j);
  }
}

var setUpTriangulationController = function(){
  triangulationController = triangFolder.add(guiInfo, 'triangulation', triangulationDict).name("Manifold");
  triangulationController.onFinishChange(function(value){
    g_triangulation = value;
    var j;
    for(j=0;j<g_weightsBasis.length;j++){ 
      triangFolder.remove(surfaceController[j]); 
    }
    if(g_numGeoms > 1){
      triangFolder.remove(geometryController);
    }
    resetPosition();

    setUpTriangulation(g_triangulation);  // sets g_weightsBasis and g_geomNames to new values
    if(guiInfo.geometryIndex > g_numGeoms - 1){
      guiInfo.geometryIndex = 0;
    }
    setUpGeometry(g_triangulation, guiInfo.geometryIndex);
    sendGluingData();
    setUpSurface(g_triangulation, g_surfaceCoeffs);
    sendWeights();
    if(g_numGeoms > 1){
      setUpGeometryController();
    }
    setUpSurfaceControllers();
  });
}

var setUpGeometryController = function(){
  geometryController = triangFolder.add(guiInfo, 'geometryIndex', g_geomNames).name("Filling");
  geometryController.onFinishChange(function(value){
    setUpGeometry(guiInfo.triangulation, value);
    sendGluingData();
  });
}

//What we need to init our dat GUI
var initGui = function(){
  guiInfo = { //Since dat gui can only modify object values we store variables here.
    GetHelp: function(){
      window.open('https://github.com/henryseg/cohomology_fractals');  
    },
    censusIndex: g_census_index,
    triangulation: g_triangulation,
    geometryIndex: 0,
    surfaceCoeffs0: 1.0,
    surfaceCoeffs1: 0.0,
    surfaceCoeffs2: 0.0,
    surfaceCoeffs3: 0.0,
    surfaceCoeffs4: 0.0,
    surfaceCoeffs5: 0.0,
    surfaceCoeffs6: 0.0,
    surfaceCoeffs7: 0.0,
    gradientIndex: 0,
    toggleUI: true,
    eToHScale: 2.0,
    logMaxDist: 2.0,
    logMaxSteps: 4.6,
    contrast: 0.0,
    normalised: true,
    perspectiveType: 1,
    viewMode: 0,
    subpixelCount: 1,
    edgeThickness: 0.0,
    screenshotSize: 0,
    resetPosition: function(){   
      resetPosition();
    },
    TakeSS: function(){
      takeScreenshot();
    },
    recording: false,
    fov: 90,
    zoomFactor: 1.0,
    logClippingRadius: -2.0,
    liftsThickness: 0.0
  };

  setUpTriangDict();

  var gui = new dat.GUI();
  gui.close();
  gui.add(guiInfo, 'GetHelp').name("Help/About");
  // triangulation and surface ---------------------------------
  var censusController = gui.add(guiInfo, 'censusIndex', {'m':0, 's':1, 'v':2, 'cool examples':3}).name("Census");
  triangFolder = gui.addFolder('Manifold and cohomology class');
  triangFolder.open();
  // triangulationController = triangFolder.add(guiInfo, 'triangulation', triangulationDict).name("Manifold");
  // triangulationController added later
  // geometryController added later
  // surfaceController added later
  // view mode -------------------------------------------------
  var viewModeController = gui.add(guiInfo, 'viewMode', {'Cohomology': 0, 'Distance': 1, 'Tetrahedron num': 2}).name("View mode");
  // things to draw --------------------------------------------
  var liftsController = gui.add(guiInfo, 'liftsThickness',0.0,2.0,0.01).name("Elevations");
  var edgeThicknessController = gui.add(guiInfo, 'edgeThickness',0.0,0.4,0.01).name("Edge thickness");
  // colour options ------------------------------------------
  var colourFolder = gui.addFolder('Colour options');
  var gradientController = colourFolder.add(guiInfo, 'gradientIndex', {'Cool': 0, 'Warm': 1, 'Neon': 2, 'Green': 3, 'Warwick': 4, 'Greyscale': 5}).name("Colour scheme");  
  var contrastController = colourFolder.add(guiInfo, 'contrast',-5.0,5.0,0.1).name("Contrast");
  var normalisedController = colourFolder.add(guiInfo, 'normalised').name("Normalised");
  // view options
  var viewFolder = gui.addFolder('View options');
  var perspectiveTypeController = viewFolder.add(guiInfo, 'perspectiveType', {'Material': 0, 'Ideal': 1, 'Hyperideal': 2}).name("Perspective type");
  var zoomController = viewFolder.add(guiInfo, 'zoomFactor',1.0,10.0,0.1).name("Zoom");
  var stepsController = viewFolder.add(guiInfo, 'logMaxSteps', 0.0,7.0,0.1).name("Log max steps");
  var distController = viewFolder.add(guiInfo, 'logMaxDist',-1.0,5.0,0.1).name("Log screen dist");
  var clippingRadiusController = viewFolder.add(guiInfo, 'logClippingRadius',-2.0,2.0,0.01).name("Log clip radius");
    // movement controls -----------------------------------------
  var scaleController = gui.add(guiInfo, 'eToHScale',0.25,8.0).name("Move speed");
  gui.add(guiInfo, 'resetPosition').name("Reset Position");
  // screenshots -----------------------------------------------
  var screenshotFolder = gui.addFolder('Screenshot');
  var screenshotSizeController = screenshotFolder.add(guiInfo, 'screenshotSize', {'1000x1000': 0, '1920x1080': 1, '4096x4096': 2}).name("Screenshot size");
  // var widthController = screenshotFolder.add(guiInfo, 'screenshotWidth');
  // var heightController = screenshotFolder.add(guiInfo, 'screenshotHeight');
  screenshotFolder.add(guiInfo, 'TakeSS').name("Take screenshot");
  var recordingController = screenshotFolder.add(guiInfo, 'recording').name("Record video");
  // extras ----------------------------------------------------
  var subpixelCountController = gui.add(guiInfo, 'subpixelCount', {'1': 1, '2': 2, '3': 3, '4': 4, '5': 5}).name("Subpixel count");

  // ------------------------------
  // UI Controllers
  // ------------------------------
  
  screenshotSizeController.onFinishChange(function(value){
    if(value == 0){
      g_screenShotResolution.x = 1000;
      g_screenShotResolution.y = 1000;
    }
    else if(value == 1){
      g_screenShotResolution.x = 1920;
      g_screenShotResolution.y = 1080;
    }
    else if(value == 2){
      g_screenShotResolution.x = 4096;
      g_screenShotResolution.y = 4096;
    }
  });

  recordingController.onFinishChange(function(value){
    if(value == true){
      g_material.uniforms.screenResolution.value.x = g_screenShotResolution.x;
      g_material.uniforms.screenResolution.value.y = g_screenShotResolution.y;
      g_effect.setSize(g_screenShotResolution.x, g_screenShotResolution.y);
      capturer = new CCapture( { format: 'jpg', quality: 85 } );
      capturer.start();
    }
    else{
      capturer.stop();
      capturer.save();
      onResize(); //Resets us back to window size
    }
  }); 

  censusController.onFinishChange(function(value){
    var j;
    for(j=0;j<g_weightsBasis.length;j++){ 
      triangFolder.remove(surfaceController[j]); 
    }
    if(g_numGeoms > 1){
      triangFolder.remove(geometryController);
    }
    triangFolder.remove(triangulationController);

    g_census_index = value;
    setUpTriangDict();
    resetPosition();
    var triangulationKeys = Object.keys(g_census_data[g_census_index]);
    triangulationKeys.sort();

    guiInfo.triangulation = triangulationKeys[0];
    g_triangulation = guiInfo.triangulation;
    setUpTriangulation(g_triangulation);  // sets g_weightsBasis and g_geomNames to new values
    if(guiInfo.geometryIndex > g_numGeoms - 1){
      guiInfo.geometryIndex = 0;
    }
    setUpGeometry(g_triangulation, guiInfo.geometryIndex);
    sendGluingData();
    setUpSurface(g_triangulation, g_surfaceCoeffs);
    sendWeights();
    // seems like we have to recursively renew all of the controller ui    
    setUpTriangulationController();
    if(g_numGeoms > 1){
      setUpGeometryController();
    }
    setUpSurfaceControllers();
  });

  setUpTriangulationController();
  if(g_numGeoms > 1){
    setUpGeometryController();
  }
  setUpSurfaceControllers();

  gradientController.onFinishChange(function(value){
    if(value == 0){ // Cool
      g_material.uniforms.gradientThreshholds.value = [0.0, 0.25, 0.45, 0.75, 1.000001];
      g_material.uniforms.gradientColours.value = [new THREE.Vector3(1.0, 1.0, 1.0), 
                                                   new THREE.Vector3(0.86274, 0.92941, 0.78431), 
                                                   new THREE.Vector3(0.25882, 0.70196, 0.83529), 
                                                   new THREE.Vector3(0.10196, 0.13725, 0.49412), 
                                                   new THREE.Vector3(0.0, 0.0, 0.0)];
    }
    else if(value == 1){ // Warm
      g_material.uniforms.gradientThreshholds.value = [0.0, 0.3, 0.65, 0.85, 1,000001];
      g_material.uniforms.gradientColours.value = [new THREE.Vector3(1.0, 1.0, 1.0), 
                                                   new THREE.Vector3(0.99607, 0.92156, 0.39607), 
                                                   new THREE.Vector3(0.89411, 0.32156, 0.10588), 
                                                   new THREE.Vector3(0.30196, 0.20392, 0.18431), 
                                                   new THREE.Vector3(0.0, 0.0, 0.0)];
    }
    else if(value == 2){ // Neon
      g_material.uniforms.gradientThreshholds.value = [0.0, 0.2, 0.45, 0.65, 1.000001];
      g_material.uniforms.gradientColours.value = [new THREE.Vector3(1.0, 1.0, 1.0), 
                                                   new THREE.Vector3(1.0, 0.92549, 0.70196), 
                                                   new THREE.Vector3(0.90980, 0.32156, 0.52156), 
                                                   new THREE.Vector3(0.41568, 0.10588, 0.60392), 
                                                   new THREE.Vector3(0.0, 0.0, 0.0)];
    }
    else if(value == 3){ // Green
      g_material.uniforms.gradientThreshholds.value = [0.0, 0.25, 0.5, 0.70, 1.000001];
      g_material.uniforms.gradientColours.value = [new THREE.Vector3(1.0, 1.0, 1.0), 
                                                   new THREE.Vector3(0.67450, 0.84705, 0.6), 
                                                   new THREE.Vector3(0.17254, 0.63529, 0.37254), 
                                                   new THREE.Vector3(0.0, 0.41176, 0.34901), 
                                                   new THREE.Vector3(0.0, 0.0, 0.0)];
    }
    else if(value == 4){ // Warwick
      g_material.uniforms.gradientThreshholds.value = [0.0, 0.25, 0.4, 0.85, 1.000001];
      g_material.uniforms.gradientColours.value = [new THREE.Vector3(1.0, 1.0, 1.0), 
                                                   new THREE.Vector3(255/255, 194/255, 51/255), // warwick bright gold 
                                                   // new THREE.Vector3(126/255, 203/255, 182/255), // warwick bright emerald green
                                                   new THREE.Vector3(239/255, 64/255, 80/255),  // warwick bright ruby red
                                                   // new THREE.Vector3(180/255, 21/255, 58/255),  // warwick ruby red
                                                   new THREE.Vector3(81/255, 28/255, 108/255),  // warwick aubergine
                                                   new THREE.Vector3(0.0, 0.0, 0.0)];
    }
    else if(value == 5){ // Greyscale
      g_material.uniforms.gradientThreshholds.value = [0.0, 1.000001, 1.000001, 1.000001, 1.000001];
      g_material.uniforms.gradientColours.value = [new THREE.Vector3(1.0, 1.0, 1.0), 
                                                   new THREE.Vector3(0.0, 0.0, 0.0),
                                                   new THREE.Vector3(0.0, 0.0, 0.0),
                                                   new THREE.Vector3(0.0, 0.0, 0.0), 
                                                   new THREE.Vector3(0.0, 0.0, 0.0)];
    }
  });

  distController.onChange(function(value){
    maxDist = Math.exp(value);
    g_material.uniforms.maxDist.value = maxDist;
  });

  stepsController.onChange(function(value){
    maxSteps = Math.floor(Math.exp(value));
    g_material.uniforms.maxSteps.value = maxSteps;
  });

  contrastController.onChange(function(value){
    g_material.uniforms.contrast.value = Math.exp(value);
  });

  normalisedController.onChange(function(value){
    g_material.uniforms.normalised.value = value;
  });

  perspectiveTypeController.onChange(function(value){
    if(g_material.uniforms.perspectiveType.value == 1){ // if it was Ideal we need to add fov slider
      fovController = viewFolder.add(guiInfo, 'fov',0,180,1).name("FOV");
      fovController.onChange(function(value){
        g_material.uniforms.fov.value = value;
      });
    }
    else if(value == 1){ // if it is now Ideal we need to remove the fov slider
      viewFolder.remove(fovController); 
    }
    g_material.uniforms.perspectiveType.value = value; // update the perspective type
  });

  edgeThicknessController.onChange(function(value){
    g_material.uniforms.edgeThickness.value = Math.pow(Math.sinh(value), 2.0); 
  });

  viewModeController.onChange(function(value){
    g_material.uniforms.viewMode.value = value;
  });

  subpixelCountController.onChange(function(value) {
    g_material.uniforms.subpixelCount.value = value;
  });

  zoomController.onChange(function(value){
    g_material.uniforms.zoomFactor.value = 1.0/value;
  });

  clippingRadiusController.onChange(function(value){
    g_material.uniforms.clippingRadius.value = Math.exp(value);
  });

  liftsController.onChange(function(value){
    g_material.uniforms.liftsThickness.value = value*value; // slower start
  });
}
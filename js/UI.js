//-------------------------------------------------------
// UI Variables
//-------------------------------------------------------

var guiInfo;
var surfaceController;
var triangulationController;
var triangulationDict;

// Inputs are from the UI parameterizations.
// gI is the guiInfo object from initGui

var sendGluingData = function(){
  g_material.uniforms.planes.value = planes;  
  g_material.uniforms.otherTetNums.value = other_tet_nums;
  g_material.uniforms.entering_face_nums.value = entering_face_nums;
  g_material.uniforms.weights.value = weights;
  g_material.uniforms.SO31tsfms.value = SO31tsfms;
}

var resetPosition = function(){
  g_tet_num = 0;
  g_material.uniforms.tetNum.value = g_tet_num;
  g_currentWeight = 0.0;
  g_material.uniforms.currentWeight.value = g_currentWeight;
  g_currentBoost.identity();
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

//What we need to init our dat GUI
var initGui = function(){
  guiInfo = { //Since dat gui can only modify object values we store variables here.
    GetHelp: function(){
      window.open('https://github.com/henryseg/Cannon-Thurston');  
    },
    censusIndex: g_census_index,
    triangulation: g_triangulation,
    surfaceIndex: g_surfaceIndex,
    gradientIndex: 0,
    toggleUI: true,
    eToHScale:2.0,
    logMaxDist:2.0,
    logMaxSteps:4.6,
    contrast:-1.2,
    perspectiveType:1,
    viewMode:0,
    subpixelCount:1,
    edgeThickness:0.0,
    screenshotWidth: g_screenShotResolution.x,
    screenshotHeight: g_screenShotResolution.y,
    resetPosition: function(){   
      resetPosition();
    },
    TakeSS: function(){
      takeScreenshot();
    },
    fov:90,
    liftsThickness:0.0
  };

  setUpTriangDict();

  var gui = new dat.GUI();
  gui.close();
  gui.add(guiInfo, 'GetHelp').name("Help/About");
  //scene settings ---------------------------------
  var censusController = gui.add(guiInfo, 'censusIndex', {'Cusped':0, 'Closed':1, 'Cusped cool exs':2, 'Closed cool exs':3}).name("Census");
  var triangFolder = gui.addFolder('Triangulation and surface');
  triangFolder.open();
  triangulationController = triangFolder.add(guiInfo, 'triangulation', triangulationDict).name("Triangulation");
  surfaceController = triangFolder.add(guiInfo, 'surfaceIndex', triangIntegerWeights).name("Surface");
  var viewModeController = gui.add(guiInfo, 'viewMode', {'Cannon-Thurston': 0, 'Distance': 1, 'Tetrahedron num': 2}).name("View mode");
  // var viewModeController = gui.add(guiInfo, 'viewMode', {'Cannon-Thurston': 0, 'Dist to Surface': 1, 'Dist to Surface + C-T': 2, 'Distance': 3, 'Translucent Surface': 4, 'Tetrahedron num': 5}).name("View mode");
  var liftsController = gui.add(guiInfo, 'liftsThickness',0.0,3.0).name("Lifts of Surface");
  var edgeThicknessController = gui.add(guiInfo, 'edgeThickness',0.0,0.2).name("Edge thickness");
  var gradientController = gui.add(guiInfo, 'gradientIndex', {'Cool': 0, 'Warm': 1, 'Neon': 2, 'Green': 3, 'Warwick': 4}).name("Gradient");
  var scaleController = gui.add(guiInfo, 'eToHScale',0.25,8.0).name("Move speed");
  var distController = gui.add(guiInfo, 'logMaxDist',0.0,5.0).name("Log screen dist");
  var stepsController = gui.add(guiInfo, 'logMaxSteps', 0.0,7.0).name("Log max steps");
  var contrastController = gui.add(guiInfo, 'contrast',-5.0,4.0).name("Contrast");
  var perspectiveTypeController = gui.add(guiInfo, 'perspectiveType', {'Material': 0, 'Ideal': 1}).name("Perspective type");
  gui.add(guiInfo, 'resetPosition').name("Reset Position");
  var screenshotFolder = gui.addFolder('Screenshot');
  var widthController = screenshotFolder.add(guiInfo, 'screenshotWidth');
  var heightController = screenshotFolder.add(guiInfo, 'screenshotHeight');
  screenshotFolder.add(guiInfo, 'TakeSS').name("Take Screenshot");
  var fovController = gui.add(guiInfo, 'fov',30,180).name("FOV");
  var subpixelCountController = gui.add(guiInfo, 'subpixelCount', {'1': 1, '2': 2, '3': 3, '4': 4, '5': 5}).name("Subpixel count");

  // ------------------------------
  // UI Controllers
  // ------------------------------
  widthController.onFinishChange(function(value){
    g_screenShotResolution.x = value;
  });

  heightController.onFinishChange(function(value){
    g_screenShotResolution.y = value;
  });

  censusController.onFinishChange(function(value){
    g_census_index = value;
    setUpTriangDict();
    resetPosition();
    var triangulationKeys = Object.keys(g_census_data[g_census_index]);
    triangulationKeys.sort();
    //see if the same triangulation is in the other census
    if(g_census_index%2 == 0){  // we are going to a cusped census
      var strippedName = stripFillingInfo(guiInfo.triangulation);
      if(triangulationKeys.indexOf(strippedName) >= 0) {guiInfo.triangulation = strippedName;}
      else {guiInfo.triangulation = triangulationKeys[0];}
    }
    else { // we are going to a closed census
      var notFound = true;
      for(i = 0; i<triangulationKeys.length; i++){
        if( stripFillingInfo(triangulationKeys[i]) == stripFillingInfo(guiInfo.triangulation)){
          guiInfo.triangulation = triangulationKeys[i];
          notFound = false;
          break;
        }
      }
      if(notFound){guiInfo.triangulation = triangulationKeys[0];}
    }

    setUpTriangulationAndSurface(guiInfo.triangulation, guiInfo.surfaceIndex);
    sendGluingData();
    // seems like we have to recursively renew all of the controller ui?
    triangFolder.remove(surfaceController); // renew surface controller ui
    triangFolder.remove(triangulationController);
    triangulationController = triangFolder.add(guiInfo, 'triangulation', triangulationDict).name("Triangulation");
    surfaceController = triangFolder.add(guiInfo, 'surfaceIndex', triangIntegerWeights).name("Surface");
    triangulationController.onFinishChange(function(value){ // renew triangulation controller ui
      resetPosition();
      setUpTriangulationAndSurface(value, 0);
      sendGluingData();
      triangFolder.remove(surfaceController); // renew surface controller ui
      surfaceController = triangFolder.add(guiInfo, 'surfaceIndex', triangIntegerWeights).name("Surface"); 
      surfaceController.onFinishChange(function(value){  
        setUpTriangulationAndSurface(guiInfo.triangulation, value);
        sendGluingData();
      });
    });
    surfaceController.onFinishChange(function(value){  // renew surface controller ui
      setUpTriangulationAndSurface(guiInfo.triangulation, value);
      sendGluingData();
    });
  });

  triangulationController.onFinishChange(function(value){
    resetPosition();
    setUpTriangulationAndSurface(value, 0);
    sendGluingData();
    triangFolder.remove(surfaceController); // renew surface controller ui
    surfaceController = triangFolder.add(guiInfo, 'surfaceIndex', triangIntegerWeights).name("Surface"); 
    surfaceController.onFinishChange(function(value){  
      setUpTriangulationAndSurface(guiInfo.triangulation, value);
      sendGluingData();
    });
  });

  surfaceController.onFinishChange(function(value){  
    setUpTriangulationAndSurface(guiInfo.triangulation, value);
    sendGluingData();
  });

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

  perspectiveTypeController.onChange(function(value){
    g_material.uniforms.perspectiveType.value = value;
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

  fovController.onChange(function(value){
    g_material.uniforms.fov.value = value;
  });

  liftsController.onChange(function(value){
    g_material.uniforms.liftsThickness.value = value;
  });

}
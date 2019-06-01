//-------------------------------------------------------
// UI Variables
//-------------------------------------------------------

var guiInfo;
var surfaceController;

// Inputs are from the UI parameterizations.
// gI is the guiInfo object from initGui

var resetPosition = function(){
  g_tet_num = 0;
  g_material.uniforms.tetNum.value = g_tet_num;
  g_currentWeight = 0.0;
  g_material.uniforms.currentWeight.value = g_currentWeight;
  g_currentBoost.identity();
  g_controllerBoosts[0].identity();
}

//What we need to init our dat GUI
var initGui = function(){
  guiInfo = { //Since dat gui can only modify object values we store variables here.
    triangulation: 'cPcbbbiht_12',
    surfaceIndex: 0,
    gradientIndex: 0,
    toggleUI: true,
    eToHScale:2.0,
    maxDist:7.5,
    maxSteps:100,
    fov:90,
    contrast:-1.2,
    viewType:1,
    // toggleStereo:false,
    // rotateEyes:false,
    // halfIpDistance: 0.03200000151991844,
    screenshotWidth: g_screenShotResolution.x,
    screenshotHeight: g_screenShotResolution.y,
    resetPosition: function(){   
      resetPosition();
    },
    TakeSS: function(){
      takeScreenshot();
    }
  };

  var triangulationKeys = Object.keys(cannon_thurston_data);
  triangulationKeys.sort();
  triangulationDict = {};
  for (var i = 0; i < triangulationKeys.length; i++) {
    triangulationDict[triangulationKeys[i]] = triangulationKeys[i];
  };

  var gui = new dat.GUI();
  gui.close();
  //scene settings ---------------------------------
  var triangFolder = gui.addFolder('Triangulation and surface');
  triangFolder.open();
  var triangulationController = triangFolder.add(guiInfo, 'triangulation', triangulationDict).name("Triangulation");
  surfaceController = triangFolder.add(guiInfo, 'surfaceIndex', triangIntegerWeights).name("Surface");
  var gradientController = gui.add(guiInfo, 'gradientIndex', {'Cool': 0, 'Warm': 1, 'Neon': 2, 'Green': 3, 'Warwick': 4}).name("Gradient");
  var scaleController = gui.add(guiInfo, 'eToHScale',0.25,8.0).name("Speed");
  var distController = gui.add(guiInfo, 'maxDist',1.0,15.0).name("Screen dist");
  var stepsController = gui.add(guiInfo, 'maxSteps', 1,400).name("Max iterations");
  var contrastController = gui.add(guiInfo, 'contrast',-5.0,2.0).name("Contrast");
  var fovController = gui.add(guiInfo, 'fov',30,180).name("FOV");
  var viewTypeController = gui.add(guiInfo, 'viewType', {'Material': 0, 'Ideal': 1}).name("View type");
  gui.add(guiInfo, 'resetPosition').name("Reset Position");
  var screenshotFolder = gui.addFolder('Screenshot');
  var widthController = screenshotFolder.add(guiInfo, 'screenshotWidth');
  var heightController = screenshotFolder.add(guiInfo, 'screenshotHeight');
  screenshotFolder.add(guiInfo, 'TakeSS').name("Take Screenshot");
  //debug settings ---------------------------------
  // var debugFolder = gui.addFolder('Debug');
  // var stereoFolder = debugFolder.addFolder('Stereo');
  // var debugUIController = debugFolder.add(guiInfo, 'toggleUI').name("Toggle Debug UI");
  // var switchToStereo = stereoFolder.add(guiInfo, 'toggleStereo').name("Toggle Stereo");
  // var rotateController = stereoFolder.add(guiInfo, 'rotateEyes').name("Rotate Eyes");
  // var pupilDistanceController = stereoFolder.add(guiInfo, 'halfIpDistance').name("Interpupiliary Distance");

  // ------------------------------
  // UI Controllers
  // ------------------------------
  widthController.onFinishChange(function(value){
    g_screenShotResolution.x = value;
  });

  heightController.onFinishChange(function(value){
    g_screenShotResolution.y = value;
  });

  triangulationController.onFinishChange(function(value){
    resetPosition();
    setUpTriangulationAndSurface(value, 0);
    g_material.uniforms.planes.value = planes;  
    g_material.uniforms.otherTetNums.value = other_tet_nums;
    g_material.uniforms.entering_face_nums.value = entering_face_nums;
    g_material.uniforms.weights.value = weights;
    g_material.uniforms.SO31tsfms.value = SO31tsfms;

    triangFolder.remove(surfaceController); // renew surface controller ui
    surfaceController = triangFolder.add(guiInfo, 'surfaceIndex', triangIntegerWeights).name("Surface"); 
    surfaceController.onFinishChange(function(value){  
      setUpTriangulationAndSurface(guiInfo.triangulation, value);
      g_material.uniforms.planes.value = planes;  
      g_material.uniforms.otherTetNums.value = other_tet_nums;
      g_material.uniforms.entering_face_nums.value = entering_face_nums;
      g_material.uniforms.weights.value = weights;
      g_material.uniforms.SO31tsfms.value = SO31tsfms;
    });

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
    else{ // Warwick
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

  // pController.onFinishChange(function(value) {
	 //  updateUniformsFromUI();
  // });

  // qController.onFinishChange(function(value) {
	 //  updateUniformsFromUI();
  // });

  // rController.onFinishChange(function(value) {
	 //  updateUniformsFromUI();
  // });

  // thicknessController.onChange(function(value) {
	 //  updateUniformsFromUI();
  // });

  // scaleController.onFinishChange(function(value) {
  //   g_material.uniforms.etohScale.value = value;
  // });

  distController.onChange(function(value) {
    g_material.uniforms.maxDist.value = value;
  });

  stepsController.onChange(function(value) {
    g_material.uniforms.maxSteps.value = value;
  });

  fovController.onChange(function(value){
    g_material.uniforms.fov.value = value;
  });

  contrastController.onChange(function(value){
    g_material.uniforms.contrast.value = Math.exp(value);
  });

  viewTypeController.onChange(function(value){
    g_material.uniforms.viewType.value = value;
  });

  // debugUIController.onFinishChange(function(value){
  //   var crosshair = document.getElementById("crosshair");
  //   var crosshairLeft = document.getElementById("crosshairLeft");
  //   var crosshairRight = document.getElementById("crosshairRight");
  //   var fps = document.getElementById("fps");
  //   var about = document.getElementById("about");
  //   if(value){
  //     about.style.visibility = 'visible';
  //     fps.style.visibility = 'visible';
  //     if(guiInfo.toggleStereo){
  //       crosshairLeft.style.visibility = 'visible';
  //       crosshairRight.style.visibility = 'visible';
  //     }
  //     else
  //       crosshair.style.visibility = 'visible';
  //   }
  //   else{
  //     about.style.visibility = 'hidden';
  //     fps.style.visibility = 'hidden';
  //     crosshair.style.visibility = 'hidden';
  //     crosshairLeft.style.visibility = 'hidden';
  //     crosshairRight.style.visibility = 'hidden';
  //   }
  // });

  // switchToStereo.onFinishChange(function(value){
  //   var crosshair = document.getElementById("crosshair");
  //   var crosshairLeft = document.getElementById("crosshairLeft");
  //   var crosshairRight = document.getElementById("crosshairRight");
  //   if(guiInfo.toggleUI){
  //     if(value){
  //       g_material.uniforms.isStereo.value = 1;
  //       crosshairLeft.style.visibility = 'visible';
  //       crosshairRight.style.visibility = 'visible';
  //       crosshair.style.visibility = 'hidden';
  //     }
  //     else{
  //       g_material.uniforms.isStereo.value = 0;
  //       g_material.uniforms.screenResolution.value.x = window.innerWidth;
  //       g_material.uniforms.screenResolution.value.y = window.innerHeight;
  //       crosshairLeft.style.visibility = 'hidden';
  //       crosshairRight.style.visibility = 'hidden';
  //       crosshair.style.visibility = 'visible';
  //     }
  //   }
  // });

  // pupilDistanceController.onFinishChange(function(value){
  //   updateEyes();
  // });

  // rotateController.onFinishChange(function(value) {
  //   updateEyes();
  // });

  // sceneController.onFinishChange(function(index){
	 //  var geoFrag = getGeometryFrag();
  //   g_material.needsUpdate = true;
  //   g_material.fragmentShader = globalsFrag.concat(lightingFrag).concat(geoFrag).concat(scenesFrag[index]).concat(mainFrag);
  // });
}
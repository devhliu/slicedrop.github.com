function initializeRenderers(){
  
  if (ren3d) {
    // do this only once
    return;
  }
    
  _webgl_supported = true;
  
 
  try {
    
    // create the XTK renderers
    ren3d = new X.renderer3D();
    ren3d.container = '3d';    
    ren3d.init();
    
  } catch (Error) {
    
    window.console.log('WebGL not supported.');
    _webgl_supported = false;
    jQuery('#3d').empty();
    console.log(jQuery('#3d'));
    
  }
  
   sliceX = new X.renderer2D();
   sliceX.container = 'sliceX';
   sliceX.orientation = 'X';
   sliceX.init();
  
   sliceY = new X.renderer2D();
   sliceY.container = 'sliceY';
   sliceY.orientation = 'Y';
   sliceY.init();
    
   sliceZ = new X.renderer2D();
   sliceZ.container = 'sliceZ';
   sliceZ.orientation = 'Z';
   sliceZ.init();

   if (!_webgl_supported) {
     ren3d = sliceZ;
     jQuery('#3d').append(jQuery('<canvas/>'));
   }
   
  ren3d.onShowtime = function() {
    
    window.console.log('Loading completed.');
    
    if (_data.volume.file.length > 0) {
      
      // show any volume also in 2d
       sliceX.add(volume);
       sliceY.add(volume);
       sliceZ.add(volume);
       sliceX.render();
       sliceY.render();
       sliceZ.render();
       
    }
    
    setupUi();
    configurator();
    
    // render();
    
  };
  
  
  //
  // LINK THE RENDERERS
  //
  // link the 2d renderers to the 3d one by setting the onScroll
  // method. this means, once you scroll in 2d, it upates 3d as well
  var _updateThreeDX = function() {

    if (_data.volume.file.length > 0) {

      jQuery('#yellow_slider').slider("option", "value",volume.indexX);
      // jQuery('#red_slider').slider("option", "value",volume.indexY);
      // jQuery('#green_slider').slider("option", "value",volume.indexZ);
      
    }
    
  };
  var _updateThreeDY = function() {

    if (_data.volume.file.length > 0) {

      jQuery('#red_slider').slider("option", "value",volume.indexY);
      
    }
    
  };
  var _updateThreeDZ = function() {

    if (_data.volume.file.length > 0) {

      jQuery('#green_slider').slider("option", "value",volume.indexZ);
      
    }
    
  };
  
  sliceX.onScroll = _updateThreeDX;
  sliceY.onScroll = _updateThreeDY;
  sliceZ.onScroll = _updateThreeDZ;  
  
  var _updateWLSlider = function() {
    
    jQuery('#windowlevel-volume').dragslider("option", "values", [volume.windowLow, volume.windowHigh]);
    
  };
  
  sliceX.onWindowLevel = _updateWLSlider;
  sliceY.onWindowLevel = _updateWLSlider;
  sliceZ.onWindowLevel = _updateWLSlider;
  
};

function createData() {
  

  // we support here max. 1 of the following
  //
  // volume (.nrrd,.mgz,.mgh)
  // labelmap (.nrrd,.mgz,.mgh)
  // colortable (.txt,.lut)
  // mesh (.stl,.vtk,.fsm,.smoothwm,.inflated,.sphere,.pial,.orig)
  // scalars (.crv)
  // fibers (.trk)
  
  //
  // the data holder for the scene
  // includes the file object, file data and valid extensions for each object
  _data = {
   'volume': {
     'file': [],
     'filedata': [],
     'extensions': ['NRRD', 'MGZ', 'MGH', 'NII', 'GZ', 'DCM', 'DICOM']
   },
   'labelmap': {
     'file': [],
     'filedata': [],
     'extensions': ['NRRD', 'MGZ', 'MGH']
   },
   'colortable': {
     'file': [],
     'filedata': [],
     'extensions': ['TXT', 'LUT']
   },
   'mesh': {
     'file': [],
     'filedata': [],
     'extensions': ['STL', 'VTK', 'FSM', 'SMOOTHWM', 'INFLATED', 'SPHERE',
                    'PIAL', 'ORIG']
   },
   'scalars': {
     'file': [],
     'filedata': [],
     'extensions': ['CRV', 'LABEL']
   },
   'fibers': {
     'file': [],
     'filedata': [],
     'extensions': ['TRK']
   },
  };  
  
}

//
// Reading files using the HTML5 FileReader.
//
function read(files) {
    
  createData();
  
  for ( var i = 0; i < files.length; i++) {
   
   var f = files[i];
   var _fileName = f.name;
   var _fileExtension = _fileName.split('.').pop().toUpperCase();
   
   // check for files with no extension
   if (_fileExtension == _fileName.toUpperCase()) {
     
     // this must be dicom
     _fileExtension = 'DCM';
     
   }
   
   var _fileSize = f.size;
   
   // check which type of file it is
   if (_data['volume']['extensions'].indexOf(_fileExtension) >= 0) {
     
     _data['volume']['file'].push(f);
     
  
   } else if (_data['colortable']['extensions'].indexOf(_fileExtension) >= 0) {
     
     // this is a color table
     _data['colortable']['file'].push(f);
     
   } else if (_data['mesh']['extensions'].indexOf(_fileExtension) >= 0) {
     
     // this is a mesh
     _data['mesh']['file'].push(f);
     
   } else if (_data['scalars']['extensions'].indexOf(_fileExtension) >= 0) {
     
     // this is a scalars file
     _data['scalars']['file'].push(f);
     
   } else if (_data['fibers']['extensions'].indexOf(_fileExtension) >= 0) {
     
     // this is a fibers file
     _data['fibers']['file'].push(f);
     
   }
   
  }

  // we now have the following data structure for the scene
  window.console.log('New data', _data);
  
  var _types = Object.keys(_data);
  
  // number of total files
  var _numberOfFiles = files.length;
  var _numberRead = 0;
  window.console.log('Total new files:', _numberOfFiles);
  
  //
  // the HTML5 File Reader callbacks
  //
  
  // setup callback for errors during reading
  var errorHandler = function(e) {
  
   console.log('Error:' + e.target.error.code);
   
  };
  
  // setup callback after reading
  var loadHandler = function(type, file) {
  
   return function(e) {
  
     // reading complete
     var data = e.target.result;
   
     // might have multiple files associated
     // attach the filedata to the right one
     _data[type]['filedata'][_data[type]['file'].indexOf(file)] = data;
   
     _numberRead++;
     if (_numberRead == _numberOfFiles) {
       
       // all done, start the parsing
       parse(_data);
       
     }
     
   };
  };


  //
  // start reading
  //
  _types.forEach(function(v) {
  
   if (_data[v]['file'].length > 0) {
     
     _data[v]['file'].forEach(function(u) {
       
       var reader = new FileReader();
       
       reader.onerror = errorHandler;
       reader.onload = (loadHandler)(v,u); // bind the current type
       
       // start reading this file
       reader.readAsArrayBuffer(u);
       
       
     });  
     
   }
   
  });

};

//
// Parse file data and setup X.objects
//
function parse(data) {
  
  // initialize renderers
  initializeRenderers();
  
  if (data['volume']['file'].length > 0) {
   
   // we have a volume
   volume = new X.volume();
   volume.file = data['volume']['file'].map(function(v) {
     
     return v.name;
     
   });
   volume.filedata = data['volume']['filedata'];
   var colortableParent = volume;
   
   if (data['labelmap']['file'].length > 0) {
     
     // we have a label map
     volume.labelmap.file = data['labelmap']['file'].map(function(v) {
       
       return v.name;
       
     });
     volume.labelmap.filedata = data['labelmap']['filedata'];
     colortableParent = volume.labelmap;
     
   }
   
   if (data['colortable']['file'].length > 0) {
     
     // we have a color table
     colortableParent.colortable.file = data['colortable']['file'].map(function(v) {
       
       return v.name;
       
     });
     colortableParent.colortable.filedata = data['colortable']['filedata'];
     
   }
   
   // add the volume
   ren3d.add(volume);
   
  }
  
  if (data['mesh']['file'].length > 0) {
   
   // we have a mesh
   mesh = new X.mesh();
   mesh.file = data['mesh']['file'].map(function(v) {
     
     return v.name;
     
   });
   mesh.filedata = data['mesh']['filedata'];
   
   if (data['scalars']['file'].length > 0) {
     
     // we have scalars
     mesh.scalars.file = data['scalars']['file'].map(function(v) {
       
       return v.name;
       
     });
     mesh.scalars.filedata = data['scalars']['filedata'];
     
   }
   
   // add the mesh
   ren3d.add(mesh);
   
  }
  
  if (data['fibers']['file'].length > 0) {
   
   // we have fibers
   fibers = new X.fibers();
   fibers.file = data['fibers']['file'].map(function(v) {
     
     return v.name;
     
   });
   fibers.filedata = data['fibers']['filedata'];
   
   // add the fibers
   ren3d.add(fibers);
   
  }
  
  ren3d.camera.position = [0,0,500];
  ren3d.render();

};



//////////////////////////////////////////////
////   Zoomer, Keystoner & Loupe v0.19    ////
//////////////////////////////////////////////

//Note: All the individual tools are wrapped into a single container at the end.

/*************************************
*		ZOOMER
*************************************/

var twitch_vid       = null;	//Declare empty 'Video' variable
var twitch_video_ref = null;	//Declare empty 'Video + UI' variable.
var twitch_ctrl_bar  = null;	//Declare empty 'Video Control Bar' variable.

var zoomer_on	 = false;  		//Zoomer is off by default.
var zoomer_x	 = 0;			//Starting X position is 0.
var zoomer_y	 = 0;			//Starting Y position is 0.

var zoomer_index = 0;   		//Declare index variable.
var zoomer_factors = [ 30,35,40,45,50,55,60,65,70,75,80,85,90,95,100,110,125,150,175,200,250,300,400,500,800,1200,2000 ];	//Zoom levels.

/*************************************
*		ZOOMER > FUNCTIONS
*************************************/
// Calculate position of content after Pan.
var PanAdjustCalc = (percentX, percentY, zoomDirection) => {
    var scale_diff = zoomer_factors[zoomer_index] - zoomer_factors[zoomer_index+zoomDirection];
    var offset_factorX = (zoomer_x + percentX) / zoomer_factors[zoomer_index+zoomDirection];
    var offset_factorY = (zoomer_y + percentY) / zoomer_factors[zoomer_index+zoomDirection];
    zoomer_x += (scale_diff * offset_factorX);
    zoomer_y += (scale_diff * offset_factorY);
}

// Zoom In, then Adjust Pan.
var ZoomIn = () => {
    if (zoomer_index == zoomer_factors.length-1) return;
    zoomer_index++;
    ZoomIt();
    PanAdjustCalc(50, 50, -1);
    PanIt();
}

// Zoom Out and Adjust Pan.
var ZoomOut = () => {
    if (zoomer_index == 0) return;
    zoomer_index--;
    ZoomIt();
    PanAdjustCalc(50, 50, 1);
    PanIt();
}

// Enable Zoomer.
var ToggleZoomer = () => 
	{
    zoomer_on = !zoomer_on;
    if (zoomer_on) {
        zoomer_overlay.style.display = "block";
    } else {
        zoomer_overlay.style.display = "none";
    }
}

// Reset Zoomer values.
var ResetZoomerValues = () => {
    if (zoomer_index > 14 || zoomer_index < 14) {
        zoomer_index = zoomer_x = zoomer_y = 14;
        ZoomIt();
        PanIt();
    }
}

// Reset Zoomer and disable UI.
var ResetZoomer = () => {
    ResetZoomerValues();
    if (zoomer_on) ToggleZoomer();
}

//Pan iterations.
var PanIt = () => {
    /* Clamp (only if Zoom is 100% or larger) */
    if (zoomer_index >= 14 ) {
        zoomer_x = (zoomer_x < 0)? 0: zoomer_x;
        zoomer_y = (zoomer_y < 0)? 0: zoomer_y;
        zoomer_x = Math.min(zoomer_x, zoomer_factors[zoomer_index]-100);
        zoomer_y = Math.min(zoomer_y, zoomer_factors[zoomer_index]-100);	
    }
    twitch_vid.style.left = - zoomer_x + "%";
    twitch_vid.style.top  = - zoomer_y + "%";
}

// Zooming action.
var ZoomIt = () => {
    var scale = zoomer_factors[zoomer_index];
    gui_button.innerText = "\xa0├\xa0" + scale + "%" + "\xa0┤\xa0"; //Returns the current scale to the GUI button.
    twitch_vid.style.height = scale + "%";
    twitch_vid.style.width  = scale + "%";
}


/*************************************
*		ZOOMER > GUI
*************************************/

var zoomer_overlay = document.createElement('div');
zoomer_overlay.className	= "zoomer-overlay";

/*************************************
*		ZOOMER > EVENTS
*************************************/

var drag = false;
var drag_check = false;
var drag_threshold = 10;
var drag_scaleX = 1;
var drag_scaleY = 1;

//When mouse pressed, then:
zoomer_overlay.addEventListener("mousedown", (e) => {
    if (zoomer_on && e.button == 0) {
        var bbox = twitch_video_ref.getBoundingClientRect();
        drag_scaleX = (bbox.width / 100); drag_scaleY = (bbox.height / 100);
        drag = [ 
            zoomer_x + (e.pageX / drag_scaleX),
            zoomer_y + (e.pageY / drag_scaleY)
        ];
        drag_check = [ e.pageX, e.pageY ];
    }
    e.preventDefault();
    e.stopPropagation();
}, true);

//When mouse released, then:
zoomer_overlay.addEventListener("mouseup", (e) => {
    if (drag_check && zoomer_index < zoomer_factors.length-1) {
        zoomer_index++;
        ZoomIt();
        var bbox = twitch_video_ref.getBoundingClientRect();
        PanAdjustCalc(
            (e.pageX - bbox.left) / drag_scaleX, 
            (e.pageY - bbox.top)  / drag_scaleY, 
            -1
        );
        PanIt();
    } else if (e.button == 2 && zoomer_index > 0) {
        zoomer_index--;
        ZoomIt();
        var bbox = twitch_video_ref.getBoundingClientRect();
        PanAdjustCalc(
            (e.pageX - bbox.left) / drag_scaleX, 
            (e.pageY - bbox.top)  / drag_scaleY, 
            1
        );
        PanIt();
    }
    drag = false;
    drag_check = false;
    zoomer_overlay.style.cursor = "zoom-in";
}, true);

//When mouse leaves screen area, then:
zoomer_overlay.addEventListener("mouseout", (e) => {
    drag = false;
    drag_check = false;
    zoomer_overlay.style.cursor = "zoom-in";
}, false);

//When mouse moves:
var passiveX = 0; var passiveY = 0;
zoomer_overlay.addEventListener("mousemove", (e) => {
    passiveX = e.pageX; passiveY = e.pageY;
    if (drag_check) {
        if ( (Math.abs(drag_check[0] - e.pageX) > drag_threshold) ||
             (Math.abs(drag_check[1] - e.pageY) > drag_threshold) ) 
        {
            drag_check = false;
            zoomer_overlay.style.cursor = "move";
        }
    }
    if (!drag_check && drag) {
        zoomer_x = drag[0] - (e.pageX / drag_scaleX);
        zoomer_y = drag[1] - (e.pageY / drag_scaleY);
        PanIt();
    }
}, true);

//Mouse Wheel input.
var last_wheel = 0;
zoomer_overlay.addEventListener("wheel", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (new Date() - last_wheel < 100) return;
    last_wheel = new Date();
    var direction = (e.deltaY < 0)? 1: -1;
    if (direction < 0 && zoomer_index == 0) return;
    if (direction > 0 && zoomer_index == zoomer_factors-1) return;

    zoomer_index += direction;
    ZoomIt();
    var bbox = twitch_video_ref.getBoundingClientRect();
    PanAdjustCalc(
        (passiveX - bbox.left) / (bbox.width / 100),
        (passiveY - bbox.top)  / (bbox.height / 100),
        -direction
    );
    PanIt();
}, true)

// Prevents right click.
zoomer_overlay.addEventListener("contextmenu", e => e.preventDefault());

// Key presses.
var keyHandler = (e) => {
    if (document.activeElement.getAttribute("role") == "textbox" ||
        document.activeElement.getAttribute("type") == "text" ||
        document.activeElement.getAttribute("type") == "search") return;

// Pressing 'ESC' resets the zoom.
    if (e.code == "Escape" && zoomer_index > 0) {
        ResetZoomer();
    }

// Pressing 'Shift' & 'Z' toggles the Zoom.
    if (e.shiftKey && (e.key == "Z" || e.key == "z")) {
        ToggleZoomer();
    }

    if (!zoomer_on) return;

// Pressing 'Up' will move it up on the Y-axis by 5.
    if (e.code == "ArrowUp") {
        zoomer_y -= 5;
        PanIt();
// Else if the keypress is 'Down', Y-axis will be added by 5 (thus moving it down since it starts from top-left).
    } else if (e.code == "ArrowDown") {
        zoomer_y += 5;
        PanIt();
// Else if 'Left' then subtracts 5 to move it left.
    } else if (e.code == "ArrowLeft") {
        zoomer_x -= 5;
        PanIt();
// Else if 'Right' then adds 5 to move it right.
    } else if (e.code == "ArrowRight") {
        zoomer_x += 5;
        PanIt();
// Else if '+' key is pressed, it does a ZoomIn.
    } else if (e.key == "+") {
        ZoomIn();
// Else if '-' key is pressed, it does a ZoomOut.
    } else if (e.key == "-") {
        ZoomOut();
    }
    e.preventDefault();
    e.stopPropagation();
}

window.addEventListener("keyup", keyHandler);


/*************************************
*		KEYSTONER
*************************************/

/* Variables */
var keystoner_on = false;		//Keystoner is off by default.
var keystoner_buttons_on = false;
var keystoner_x = 0;			//Starting X rotation is 0.
var keystoner_y = 0;			//Starting Y rotation is 0.
var perspectiveValue = 50;		//Perspective effect in centimeters.
var pushValue = 2;				//Strength of a single 'Push'.
var pushDiagValue = 1;  		//Strength of a single diagonal 'Push'.


/*************************************
*		KEYSTONER > FUNCTIONS
*************************************/

// Enable Keystoner.
var ToggleKeystoner = () =>
{
    keystoner_on = !keystoner_on;
    if (keystoner_on){
        keystoner_overlay.style.display = "grid";
    } else {
        keystoner_overlay.style.display = "none";
    }
}

// Reset Keystoner.
var ResetKeystonerValues = () => {
    if (keystoner_x != 0 || keystoner_y != 0) {
        keystoner_x = 0;
        keystoner_y = 0;
        Shifter();
    }
}

// Reset Keystoner and disable UI.
var ResetKeystoner = () => {
    ResetKeystonerValues();
    if (keystoner_on) ToggleKeystoner();
}

//Show the Keystoner GUI.
var ToggleKeystonerButtons = () => {
	keystoner_buttons_on = !keystoner_buttons_on;
    if (keystoner_buttons_on){
        keystoner_buttons_container.style.display = "grid";
        keystoner_toggle.innerText = "◃🞖▹";
		keystoner_toggle.style.backgroundColor = "#c91010";

		//Permanently disables loupe until reset.
		loupe_overlay.style.display = "none";
		document.removeChild(canvas_element);

    } else {
        keystoner_buttons_container.style.display = "none";
        keystoner_toggle.innerText = "▹▣◃";
		keystoner_toggle.style.backgroundColor = "grey";
    }
}

// Shift Keystone after a "push" from the GUI arrows.
var Shifter = () => {
	twitch_vid.style.transform = "perspective("+ perspectiveValue +"cm) rotateX(" + keystoner_x + "deg) rotateY(" + keystoner_y + "deg)";
}


/*************************************
*		KEYSTONER > GUI
*************************************/

/* Overlay. */
var keystoner_overlay = document.createElement('div');
keystoner_overlay.className	= 'keystoner-overlay';

/* Toggle for 'Push' buttons. */
var keystoner_toggle = document.createElement('div');
keystoner_toggle.className = 'keystoner-toggle';
keystoner_toggle.innerText = "▹▣◃";
keystoner_overlay.appendChild(keystoner_toggle);

/* Container for 'Push' buttons. */
var keystoner_buttons_container = document.createElement('div');
keystoner_buttons_container.className = 'keystoner-buttons-container';
keystoner_overlay.appendChild(keystoner_buttons_container);

/* Buttons on the 'Buttons Container' grid. */
var push_northwest = document.createElement('div');
push_northwest.className = 'push-northwest';
keystoner_buttons_container.appendChild(push_northwest);

var push_north = document.createElement('div');
push_north.className = 'push-north';
keystoner_buttons_container.appendChild(push_north);

var push_northeast = document.createElement('div');
push_northeast.className = 'push-northeast';
keystoner_buttons_container.appendChild(push_northeast);

var push_west = document.createElement('div');
push_west.className = 'push-west';
keystoner_buttons_container.appendChild(push_west);

var push_reset = document.createElement('div');
push_reset.className = 'push-reset';
push_reset.innerText = 'RESET';
keystoner_buttons_container.appendChild(push_reset);

var push_east = document.createElement('div');
push_east.className = 'push-east';
keystoner_buttons_container.appendChild(push_east);

var push_southwest = document.createElement('div');
push_southwest.className = 'push-southwest';
keystoner_buttons_container.appendChild(push_southwest);

var push_south = document.createElement('div');
push_south.className = 'push-south';
keystoner_buttons_container.appendChild(push_south);

var push_southeast = document.createElement('div');
push_southeast.className = 'push-southeast';
keystoner_buttons_container.appendChild(push_southeast);


/*************************************
*		KEYSTONER > EVENTS
*************************************/
/* Show the buttons UI */
keystoner_toggle.addEventListener("click", ToggleKeystonerButtons, false);

//UI Arrow 'Pushes' that ADD or SUBTRACT to a X or a Y rotation, then runs 'Shifter()', that appends it as a CSS style onto the <video> element.

/* TOP ROW */
push_northwest.addEventListener("click", (e) => {
	keystoner_x += pushDiagValue;
	keystoner_y -= pushDiagValue;
	Shifter();
}, false);

push_north.addEventListener("click", (e) => {
	keystoner_x += pushValue;
	Shifter();
}, false);

push_northeast.addEventListener("click", (e) => {
	keystoner_x += pushDiagValue;
	keystoner_y += pushDiagValue;
	Shifter();
}, false);

/* MIDDLE ROW */
push_west.addEventListener("click", (e) => {
	keystoner_y -= pushValue;
	Shifter();
}, false);

//Reset Keystoner and Zoomer, but keep UI.
push_reset.addEventListener("click", (e) => {
	ResetKeystonerValues();
	ResetZoomerValues();
}, false);

push_east.addEventListener("click", (e) => {
	keystoner_y += pushValue;
	Shifter();
}, false);

/* BOTTOM ROW */
push_southwest.addEventListener("click", (e) => {
	keystoner_x -= pushDiagValue;
	keystoner_y -= pushDiagValue;
	Shifter();
}, false);

push_south.addEventListener("click", (e) => {
	keystoner_x -= pushValue;
	Shifter();
}, false);

push_southeast.addEventListener("click", (e) => {
	keystoner_x -= pushDiagValue;
	keystoner_y += pushDiagValue;
	Shifter();
}, false);


/*************************************
*		LOUPE
*************************************/
var dragbox_width	= 98;	//percentage
var dragbox_height	= 90;	//percentage
var dragbox_left	= 1;	//percentage
var dragbox_top 	= 0;	//percentage

/* Loupe container */
var loupe_overlay = document.createElement('div');
loupe_overlay.className = 'loupe-overlay';

/* Loupe Window */
var loupe_window = document.createElement('loupe');
loupe_window.className = 'loupe-window';

/* Loupe Drag Box */
var loupe_drag_box = document.createElement('box');
loupe_drag_box.className = 'loupe-drag-box';
loupe_drag_box.style.position = "absolute";
loupe_drag_box.style.width = dragbox_width + "%";
loupe_drag_box.style.height = dragbox_height + "%";
loupe_drag_box.style.left = dragbox_left + "%";
loupe_drag_box.style.top = dragbox_top + "%";

/* Loupe Drag Handles */
// Add elements to resize the loupe with.
var loupe_drag_top = document.createElement('div');
loupe_drag_top.className = 'loupe-drag-top loupe-drag';
var loupe_drag_left = document.createElement('div');
loupe_drag_left.className = 'loupe-drag-left loupe-drag';
var loupe_drag_right = document.createElement('div');
loupe_drag_right.className = 'loupe-drag-right loupe-drag';
var loupe_drag_bottom = document.createElement('div');
loupe_drag_bottom.className = 'loupe-drag-bottom loupe-drag';

//Corners.
var loupe_drag_topleft = document.createElement('div');
loupe_drag_topleft.className = 'loupe-drag-topleft loupe-drag-corner';
var loupe_drag_topright = document.createElement('div');
loupe_drag_topright.className = 'loupe-drag-topright loupe-drag-corner';
var loupe_drag_bottomleft = document.createElement('div');
loupe_drag_bottomleft.className = 'loupe-drag-bottomleft loupe-drag-corner';
var loupe_drag_bottomright = document.createElement('div');
loupe_drag_bottomright.className = 'loupe-drag-bottomright loupe-drag-corner';

//Appends handles into a box.
loupe_drag_box.appendChild(loupe_drag_top);
loupe_drag_box.appendChild(loupe_drag_left);
loupe_drag_box.appendChild(loupe_drag_right);
loupe_drag_box.appendChild(loupe_drag_bottom);
loupe_drag_box.appendChild(loupe_drag_topleft);
loupe_drag_box.appendChild(loupe_drag_topright);
loupe_drag_box.appendChild(loupe_drag_bottomleft);
loupe_drag_box.appendChild(loupe_drag_bottomright);

//Append the box into the window element.
loupe_window.appendChild(loupe_drag_box);

//Append the window into a container.
loupe_overlay.appendChild(loupe_window);


/*************************************
*		LOUPE > CANVAS
*************************************/

//Create the canvas where the video will be drawn on.
var canvas_element = document.createElement('canvas');
canvas_element.className		= 'canvas';

//Maximum resolution canvas so it doesn't scale up from a lower resolution (i.e video bounding box: 1152px, cropped to 100px, then upscaled to 400px).
canvas_element.width			= '1920';
canvas_element.height			= '1080';
canvas_element.style.left		= loupe_window_left + "%";
canvas_element.style.top		= loupe_window_top + "%";

//TODO:
//Types are: auto|smooth|high-quality|crisp-edges|pixelated|initial|inherit;
//var CanvasImageRenderingType = "crisp-edges";
//canvas_element.style.imageRendering = "crisp-edges";

//Add canvas to the loupe container as first element.
loupe_overlay.prepend(canvas_element);


/*************************************
*		LOUPE > RESIZE
*************************************/

/* Overlay */
var loupe_resize = document.createElement('div');
loupe_resize.className			= 'loupe-resize';

/* Note: re-uses 'Keystoner' buttons and CSS effects. */
var resize_northwest = document.createElement('div');
resize_northwest.className = 'push-northwest resize-btn resize-northwest';
loupe_resize.appendChild(resize_northwest);
var resize_northeast = document.createElement('div');
resize_northeast.className = 'push-northeast resize-btn resize-northeast';
loupe_resize.appendChild(resize_northeast);
var resize_southwest = document.createElement('div');
resize_southwest.className = 'push-southwest resize-btn resize-southwest';
loupe_resize.appendChild(resize_southwest);
var resize_southeast = document.createElement('div');
resize_southeast.className = 'push-southeast resize-btn resize-southeast';
loupe_resize.appendChild(resize_southeast);
//On the grid.
var resize_scaleinfo = document.createElement('div');
resize_scaleinfo.className = 'resize-scaleinfo';
loupe_resize.appendChild(resize_scaleinfo);

//Add Loupe Resize Overlay
loupe_drag_box.appendChild(loupe_resize);


/*************************************
*		LOUPE > FUNCTIONS
*************************************/

/* Toggle Loupe */
var ToggleLoupe = () => {
loupe_on = !loupe_on;
    if (loupe_on) {
        loupe_overlay.style.display = "block";
        canvas_element.style.display = "block";
		loupe_window.style.display = "block";
		loupe_on = true;
		updateDimensions();
		
		//Crops the canvas.
		Cropper();
		
		//Crops the loupe.
		CropperWindow();
		
		
    } else {
		loupe_window.style.display = "none";
		loupe_on = false;
    }
};

/* RESET Loupe */
var ResetLoupe = () => {

    /* Reset Loupe Overlay, Window & Canvas. */
    //Disable visibility.
	loupe_on = false;
	
	loupe_overlay.style.display  = "none";	//Overlay Container.
	loupe_window.style.display   = "none";	//Loupe Window.
	canvas_element.style.display = "none";	//Image Canvas.
	
	//Default variables.
	loupe_window_left	= 0;
	loupe_window_top	= 0;
	loupe_window_left_updated	= 0;
	loupe_window_top_updated	= 0;
	
	//Default positions.
    loupe_window.style.left = loupe_window_left + '%';
    loupe_window.style.top	= loupe_window_top + '%';
    loupe_window.style.width  = "100%";
    loupe_window.style.height = "100%";

	canvas_element.style.left = loupe_window_left + '%';
    canvas_element.style.top  = loupe_window_top + '%';
    canvas_element.style.width  = "100%";
    canvas_element.style.height = "100%";
    
    
    /* Reset Loupe Dragbox */
	//Default variables.
	dragbox_width_onclick	= 0; 
	dragbox_height_onclick	= 0;
	
	dragbox_width_updated	= 0;
	dragbox_height_updated	= 0;
	dragbox_left_updated	= 0;
	dragbox_top_updated 	= 0;
	
	dragbox_width	= 98;
	dragbox_height	= 90;
	dragbox_left	= 1;
	dragbox_top 	= 0;

	//Default position.
    loupe_drag_box.style.width	= '98%';
    loupe_drag_box.style.height = '90%';
    loupe_drag_box.style.top	= '0%';
    loupe_drag_box.style.left	= '1%';
    
    
    /* Reset resizers. */
	resizer_on	= false;
	firstPass	= true;
	loupe_resize_origin	= null;
	loupe_resize_active	= "none";
	differenceX = 0;
	differenceY = 0;
	
	
	/* Reset scaling. */
	ResetLoupeScale();
	
	
	/* Reset origin */
	origin_x = 0;
	origin_y = 0;
	origin_x_updated = 0;
	origin_y_updated = 0;
	
	
    /* Reset cropping */
    //Reset canvas cropping.
	cropTop 	= 0;
	cropRight	= 0;
	cropBottom	= 0;
	cropLeft	= 0;
	Cropper();
	
	//Reset window cropping.
	skipWindowCrop == false;
	CropperWindow();
};

/* Update Loupe Dimensions */
var updateDimensions = () => {
	//Calculate the width of the overlay for 16:9 video upon UI resize event.
	
	var video = twitch_vid.getBoundingClientRect();
	//console.log('bounding in function:', video);
	
	//Current aspect ratio to detect pillarboxes and letterboxes.
	var current_aspect_ratio = video.width / video.height;

	//Video aspect ratio.
	var default_aspect_ratio = 16/9;
	
	//Actual displayed video width, derived from height (16:9).
	var vid_width = video.height * default_aspect_ratio;
	//Actual displayed video height, derived from width (16:9).
	var vid_height = video.width / default_aspect_ratio;

	//Percentage of video within the displayed area.
	var vid_width_perc = (vid_width / video.width) * 100;
	//Percentage of video within the displayed area.
	var vid_height_perc = (vid_height / video.height) * 100;
	
	//Percentage at which video starts on the left. Always a positive value.
	var actual_vid_left = ((100 - vid_width_perc) / 2);
	//Percentage at which video starts on the left. Always a positive value.
	var actual_vid_top = ((100 - vid_height_perc) / 2);

	
	//DEBUG
	//console.log('current AR:', current_aspect_ratio);
	//console.log('actual video width:', vid_width);
	//console.log('actual video width in %:', vid_width_perc);
	//console.log('Left video start %: ', actual_vid_left);

	
	//When player area is wider than the video, squeeze Loupe to the width of the video.
	if (current_aspect_ratio > default_aspect_ratio) {
		//Update width.
		container.style.width = vid_width_perc + "%";
		
		//Update left.
		container.style.left = actual_vid_left + "%";
	} 
	//When player area is higher than the video, squeeze Loupe to the height of the video.
	else if (current_aspect_ratio < default_aspect_ratio){
		//Update height.
		container.style.width = vid_height_perc + "%";
		
		//Update top.
		container.style.top = actual_vid_top + "%";
	}
	//Otherwise, when all matches, set Loupe at 100%.
	else {
		container.style.left = 0 + "%";
		container.style.top = 0 + "%";
		container.style.width = '100%';
		container.style.height = '100%';
	}
	
};


/* Draw Canvas Image */
var DrawCanvas = () => {
	var context = canvas_element.getContext('2d');
	if (context) {
		setInterval(function () {
		//Draw image at 1920x1080.
		context.drawImage(twitch_vid, 0, 0, 1920, 1080);
		
		//Toggle smoothing off (default is on).
		//context.imageSmoothingEnabled = false;
		
		//Example: Both input crop and destination location & dimensions.
		//context.drawImage(twitch_vid, 0, 0, drawingInputW, drawingInputH, 0, 0, 640, 360);
		
		//Example: Image, then dest X, dest Y, dest width, dest height.
		//context.drawImage(twitch_vid, 50, 150, 640, 360, 8, 8, 640, 360);
    	}, 8.333) //16.666 for 30fps. 8.333 for 60fps.
	};
};


/* Crop the Canvas */
var cropTop		 = 0;
var cropRight	 = 0;
var cropBottom	 = 0;
var cropLeft	 = 0;
var skipWindowCrop = false;

var Cropper = () => {
	var CanvasSize = canvas_element.getBoundingClientRect();
	var DragBoxSize = loupe_drag_box.getBoundingClientRect();
	
	//Calculate the size difference between the canvas and the drag box & convert the difference into a percentage.
	cropTop = (CanvasSize.top - DragBoxSize.top) / CanvasSize.height * -100;
	cropRight = (CanvasSize.right - DragBoxSize.right) / CanvasSize.width * 100;
	cropBottom = (CanvasSize.bottom - DragBoxSize.bottom) / CanvasSize.height * 100;
	cropLeft = (CanvasSize.left - DragBoxSize.left) / CanvasSize.width * -100;
	
	//Crop canvas (Top, Right, Bottom, Left).
	canvas_element.style.clipPath 	= "inset(" + cropTop + "% " + cropRight + "% " + cropBottom + "% "+ cropLeft + "%)";	
	
	//DEBUG
	/*
	console.log(CanvasSize, DragBoxSize);
	console.log('CLIP-PATH: ', cropTop, cropRight, cropBottom, cropLeft);
	console.log('Canvas Sizes: ', 'Top:',CanvasSize.top, 'Right:', CanvasSize.right, 'Bottom:', CanvasSize.bottom, 'Left:', CanvasSize.left);
	console.log('Dragbox Sizes: ', 'Top:', DragBoxSize.top, 'Right:', DragBoxSize.right, 'Bottom:', DragBoxSize.bottom, 'Left:', DragBoxSize.left);
	*/
};

/* Crop the Loupe Window */
var CropperWindow = () => {
	if (skipWindowCrop == true){
		loupe_window.style.clipPath 	= "";
	} else {
		//Crop Loupe Window area to match canvas.
		loupe_window.style.clipPath 	= "inset(" + cropTop + "% " + cropRight + "% " + cropBottom + "% "+ cropLeft + "%)";
	}
}


/*************************************
*		LOUPE > WINDOW
*************************************/
var sX = 0; //Mouse start.
var sY = 0; //Mouse start.

var loupe_on = false;
var loupe_window_left = 0;
var loupe_window_top = 0;
var loupe_window_left_updated = 0;
var loupe_window_top_updated = 0;

  
var LoupeWindowMouseDown = (e) => {
	sX = e.pageX;
    sY = e.pageY;
    
    document.addEventListener('mousemove', LoupeWindowMouseMove, false);
    document.addEventListener('mouseup', LoupeWindowMouseUp, false);
    
    //Disable UI cropping while the Loupe is being changed.
    skipWindowCrop = true;
    CropperWindow();
    
    e.preventDefault();
    e.stopPropagation();
};

var LoupeWindowMouseMove = (e) => {
	//Mouse movement distances in px.
	var dX = e.pageX - sX;
    var dY = e.pageY - sY;
    //Convert them into percentages.
    var perc_dX = (dX / dragbox_width_onclick) * 100;
    var perc_dY = (dY / dragbox_height_onclick) * 100;
    
    loupe_window_left_updated = loupe_window_left + perc_dX;
    loupe_window_top_updated = loupe_window_top + perc_dY;
    
    canvas_element.style.left = loupe_window_left_updated + '%';
    canvas_element.style.top = loupe_window_top_updated + '%';
    
    loupe_window.style.left = loupe_window_left_updated + '%';
    loupe_window.style.top = loupe_window_top_updated + '%';

	//Cursor.
	loupe_window.style.cursor = "grabbing";
};

//Upon mouse up:
var LoupeWindowMouseUp = (e) => {
	document.removeEventListener('mousemove', LoupeWindowMouseMove);
	document.removeEventListener('mouseup', LoupeWindowMouseUp);

	//Update the global variables for use with the next mousedown event.
	loupe_window_left = loupe_window_left_updated;
	loupe_window_top = loupe_window_top_updated;
	
	//Reset cursor
	loupe_window.style.cursor = "grab";
	
	//Crop the invisible Loupe Window area to match, AFTER the Canvas has been cropped.
	skipWindowCrop = false;
	CropperWindow();	
};

/* EVENTS */
//Listen to the Loupe Window.
loupe_window.addEventListener('mousedown', LoupeWindowMouseDown, false);


/*************************************
*		LOUPE > DRAGBOX
*************************************/

var loupe_drag_active = "none";

var perc_dX = 0;	//percentage
var perc_dY = 0;	//percentage

var dragbox_width_onclick	= 0; //pixels
var dragbox_height_onclick	= 0; //pixels

var dragbox_width_updated = 0;	//percentage
var dragbox_height_updated = 0;	//percentage
var dragbox_left_updated = 0;	//percentage
var dragbox_top_updated = 0;	//percentage

var dragbox_width_minimum = 9;  //percentage
var dragbox_height_minimum = 16; //percentage


/* FUNCTIONS */
var clampDragbox = () => {
	
	//Set the top position up to the minimum height on the bottom & at the least the minimum on the top.
	if (dragbox_top_updated > (100 - dragbox_height_minimum)){
		dragbox_top_updated = (100 - dragbox_height_minimum);
	}
	else if (dragbox_top_updated < 0){
    	dragbox_top_updated = 0;
    }
    
    //Set the maximum left position up to the minimum width from the right edge. No less than 0 from the left.
    if (dragbox_left_updated > (100 - dragbox_width_minimum)){
    	dragbox_left_updated = (100 - dragbox_width_minimum);
    }
    else if (dragbox_left_updated < 0){
    	dragbox_left_updated = 0;
    }
    
    var check_width = dragbox_left_updated + dragbox_width_updated;
	var check_height = dragbox_top_updated + dragbox_height_updated;
    
    //Width
    //left + width has to be less than 100.
    if (check_width > 100){
    	dragbox_width_updated = 100 - dragbox_left_updated;
    }
    else if (check_width < (dragbox_width_minimum + dragbox_left_updated)){
    	dragbox_width_updated = dragbox_width_minimum;
    }
    
    //Height
    //top + height has to be less than 100.
    if (check_height > 100){
    	dragbox_height_updated = 100 - dragbox_top_updated;
    }
    else if (check_height < (dragbox_height_minimum + dragbox_top_updated)){
    	dragbox_height_updated = dragbox_height_minimum;
    }
    
    //DEBUG
    //console.log('top', dragbox_top_updated, 'left', dragbox_left_updated, 'width', dragbox_width_updated,'height', dragbox_height_updated,'flag', clamp_limiter);
}

var LoupeDragboxMouseDown = (e) => {
	sX = e.pageX;
    sY = e.pageY;
    
    //Update on first click to get the dimensions and position at the time (in px!).
    if (dragbox_width_onclick == 0) {
    dragbox_width_onclick = loupe_drag_box.getBoundingClientRect().width;
    }
    if (dragbox_height_onclick == 0) {
    dragbox_height_onclick = loupe_drag_box.getBoundingClientRect().height;
    }
    
    document.addEventListener('mousemove', LoupeDragboxMouseMove, false);
    document.addEventListener('mouseup', LoupeDragboxMouseUp, false);
    
    //Disable UI cropping while the Loupe is being changed.
    skipWindowCrop = true;
    CropperWindow();
    
    //Draw Image
    DrawCanvas();
    
    //Change from clicks passing through to Zoomer to catching them.
    loupe_window.style.pointerEvents = 'auto';
    loupe_resize.style.pointerEvents = 'auto';
    
    
    e.preventDefault();
    e.stopPropagation();
};

var LoupeDragboxMouseMove = (e) => {
	//Mouse movement distances in px.
	var dX = e.pageX - sX;
    var dY = e.pageY - sY;
    //Convert them into percentages.
    perc_dX = (dX / dragbox_width_onclick) * 100;
    perc_dY = (dY / dragbox_height_onclick) * 100;

    
    /* DRAGBOX RESIZING */
    
    //EDGE HANDLES
    //Reposition the entire dragbox.
    if (loupe_drag_active == "top" || loupe_drag_active == "right" || loupe_drag_active == "bottom" || loupe_drag_active == "left") {
    	
    	//Move from the top & left.
    	dragbox_top_updated = dragbox_top + perc_dY;
    	dragbox_left_updated = dragbox_left + perc_dX;
    	
    	//Set the top position and minimum value.
		if (dragbox_top_updated > (100 - dragbox_height_updated)){
			dragbox_top_updated = (100 - dragbox_height_updated);
		}
		else if (dragbox_top_updated < 0){
    		dragbox_top_updated = 0;
    	}
    
    	//Set the left position and minimum value.
    		if (dragbox_left_updated > (100 - dragbox_width_updated)){
    		dragbox_left_updated = (100 - dragbox_width_updated);
    	}
    	else if (dragbox_left_updated < 0){
    		dragbox_left_updated = 0;
    	}
    }
    
    //CORNER HANDLES
    //Reposition the corners.
    else if (loupe_drag_active == "topleft"){
    	//Top percentage.
    	dragbox_top_updated = dragbox_top + perc_dY;
    	dragbox_height_updated = dragbox_height - perc_dY;
    	//Left percentage.
    	dragbox_left_updated = dragbox_left + perc_dX;
    	dragbox_width_updated = dragbox_width - perc_dX;
    	
    	//Conform to size limits.
    	clampDragbox();
    }
    else if (loupe_drag_active == "topright"){
		//Top percentage.
    	dragbox_top_updated = dragbox_top + perc_dY;
    	dragbox_height_updated = dragbox_height - perc_dY;
    	//Right percentage.
		dragbox_width_updated = dragbox_width + perc_dX;
    	
    	//Conform to size limits.
    	clampDragbox();
    }
    else if (loupe_drag_active == "bottomleft"){
    	//Bottom percentage.
    	dragbox_height_updated = dragbox_height + perc_dY;
    	//Left percentage.
    	dragbox_left_updated = dragbox_left + perc_dX;
    	dragbox_width_updated = dragbox_width - perc_dX;
    	
    	//Conform to size limits.
    	clampDragbox();
    }
    else if (loupe_drag_active == "bottomright"){
    	//Bottom percentage.
    	dragbox_height_updated = dragbox_height + perc_dY;
    	//Right percentage.
    	dragbox_width_updated = dragbox_width + perc_dX;
    	
    	//Conform to size limits.
    	clampDragbox();
    }
    
    //Update vertical.
    loupe_drag_box.style.top = dragbox_top_updated + '%';
    loupe_drag_box.style.height = dragbox_height_updated + '%';
    //Update horizontal.
    loupe_drag_box.style.left = dragbox_left_updated + '%';
    loupe_drag_box.style.width = dragbox_width_updated + '%';
    
    
    //DEBUG
    //console.log(dragbox_left_updated, '=', dragbox_left,'+',perc_dX);
    //console.log(dragbox_width_updated, '=', dragbox_width, '+', perc_dY);
    //console.log('Mousetop', dragbox_top_updated, 'Mouseleft', dragbox_left_updated, 'Mousewidth', dragbox_width_updated,'Mouseheight', dragbox_height_updated);
    
    //Cropper changes the window size, so the math gets thrown off.
    Cropper();
};

//Upon mouse up:
var LoupeDragboxMouseUp = (e) => {
	document.removeEventListener('mousemove', LoupeDragboxMouseMove);
	document.removeEventListener('mouseup', LoupeDragboxMouseUp);
	
	//Update the global variables for use with the next mousedown event.
	dragbox_width = dragbox_width_updated;
	dragbox_height = dragbox_height_updated;
	dragbox_left = dragbox_left_updated;
	dragbox_top = dragbox_top_updated;
	
	//Reset the drag direction.
	loupe_drag_active = "none";
	
	//Crop the invisible Loupe Window area to match, AFTER the Canvas has been cropped.
	skipWindowCrop = false;
	CropperWindow();
};

/* EVENTS */

//Listen to the left handle, set the direction variable. 
loupe_drag_left.addEventListener('mousedown', LoupeDragboxMouseDown, false);
loupe_drag_left.addEventListener('mousedown', function () {loupe_drag_active = "left";}, false);
//Listen to the right handle, set the direction variable. 
loupe_drag_right.addEventListener('mousedown', LoupeDragboxMouseDown, false);
loupe_drag_right.addEventListener('mousedown', function () {loupe_drag_active = "right";}, false);
//Listen to the top handle, set the direction variable. 
loupe_drag_top.addEventListener('mousedown', LoupeDragboxMouseDown, false);
loupe_drag_top.addEventListener('mousedown', function () {loupe_drag_active = "top";}, false);
//Listen to the bottom handle, set the direction variable. 
loupe_drag_bottom.addEventListener('mousedown', LoupeDragboxMouseDown, false);
loupe_drag_bottom.addEventListener('mousedown', function () {loupe_drag_active = "bottom";}, false);
//Listen to the topleft handle, set the direction variable. 
loupe_drag_topleft.addEventListener('mousedown', LoupeDragboxMouseDown, false);
loupe_drag_topleft.addEventListener('mousedown', function () {loupe_drag_active = "topleft";}, false);
//Listen to the topright handle, set the direction variable. 
loupe_drag_topright.addEventListener('mousedown', LoupeDragboxMouseDown, false);
loupe_drag_topright.addEventListener('mousedown', function () {loupe_drag_active = "topright";}, false);
//Listen to the bottom handle, set the direction variable. 
loupe_drag_bottomleft.addEventListener('mousedown', LoupeDragboxMouseDown, false);
loupe_drag_bottomleft.addEventListener('mousedown', function () {loupe_drag_active = "bottomleft";}, false);
//Listen to the bottom handle, set the direction variable. 
loupe_drag_bottomright.addEventListener('mousedown', LoupeDragboxMouseDown, false);
loupe_drag_bottomright.addEventListener('mousedown', function () {loupe_drag_active = "bottomright";}, false);

/*************************************
*		LOUPE > RESIZE
*************************************/
var resizer_on			= false;
var loupe_resize_origin	= null;
var loupe_resize_active	= "none";
var loupe_scale			= 100;
var loupe_scale_updated = 100;

var firstPass = true;
var differenceX = 0;
var differenceY = 0;


/* Functions */
var ResetLoupeScale = () => {
	loupe_scale = 100;
	loupe_scale_updated = 100;
	loupe_window.style.transform = 'scale(' + loupe_scale + '%)';
    canvas_element.style.transform = 'scale(' + loupe_scale + '%)';
    resize_scaleinfo.innerText = loupe_scale + "%";
    gui_button.innerText = '\xa0├\xa0' + loupe_scale + '%\xa0┤\xa0';
};

//Reset the already resized and repositioned loupe while keeping the cropping.
var resetResize = () => {
	var setX = 0;
	var setY = 0;
	
	//Update positions.
	loupe_window.style.left = setX + "%";
    loupe_window.style.top = setY + "%";
    canvas_element.style.left = setX + "%";
    canvas_element.style.top = setY + "%";
    
    loupe_window_left = setX;
    loupe_window_left_updated = setX; 
    loupe_window_top = setY;
    loupe_window_top_updated = setY;
}

//Show the scaling info in the GUI.
var scaleInfo = () => {
	var scaleinfo_canvas = loupe_scale_updated;
	resize_scaleinfo.innerText = scaleinfo_canvas + "%";
	gui_button.innerText = '\xa0├\xa0' + scaleinfo_canvas + '%\xa0┤\xa0';
}

//Show reset upon hover.
var scaleInfoOnMouseOver = () => {
	resize_scaleinfo.innerText = "reset";
}

//Restore the scaling information when no longer hovering.
var scaleInfoMouseOut = () => {
	scaleInfo();
}

//Limit scaling between 25% and 800%.
var clampScale = () => {
	if (loupe_scale_updated > 800){
		loupe_scale_updated = 800;
	}
	else if (loupe_scale_updated < 25){
    	loupe_scale_updated = 25;
    }
}

var LoupeResizeMouseDown = (e) => {
	sX = e.pageX;
    sY = e.pageY;
    
    //Update on first click to get the dimensions and position at the time (in px!).
    if (dragbox_width_onclick == 0) {
    dragbox_width_onclick = loupe_drag_box.getBoundingClientRect().width;
    }
    if (dragbox_height_onclick == 0) {
    dragbox_height_onclick = loupe_drag_box.getBoundingClientRect().height;
    }
    
    document.addEventListener('mousemove', LoupeResizeMouseMove, false);
    document.addEventListener('mouseup', LoupeResizeMouseUp, false);
    
    //Disable UI cropping while the Loupe is being changed.
    skipWindowCrop = true;
    CropperWindow();
    
    //If it hasn't been drawn yet, draw the canvas upon resize initialization.
    DrawCanvas();
    
    //Change from clicks passing through to Zoomer to catching them.
    loupe_window.style.pointerEvents = 'auto';
    loupe_resize.style.pointerEvents = 'auto';
    
    
    e.preventDefault();
    e.stopPropagation();
};

var LoupeResizeMouseMove = (e) => {
	//Mouse movement distances in px.
	var dX = e.pageX - sX;
    var dY = e.pageY - sY;
    //Convert them into percentages.
    var perc_dX = (dX / dragbox_width_onclick) * 100;
    var perc_dY = (dY / dragbox_height_onclick) * 100;
    
    
    //Scale the loupe window and canvas elements (in integers).
    if (loupe_resize_active == "northwest"){
    	//Calculate scale change.
    	loupe_scale_updated = Math.round(loupe_scale - (perc_dX + perc_dY));
    	
    	//Limit scaling between set limits.
    	clampScale();
    	
    	//Holds dragbox bottom-right in place.
    	var scale = (loupe_scale_updated / 100) - 1;
    	loupe_window_left_updated = (dragbox_left + dragbox_width) * (scale * -1);
    	loupe_window_top_updated = (dragbox_top + dragbox_height) * (scale * -1);
    }
    else if (loupe_resize_active == "northeast"){
    	//Calculate scale change.
    	loupe_scale_updated = Math.round(loupe_scale - ((perc_dX - perc_dY) *-1));
    	
    	//Limit scaling between set limits.
    	clampScale();
    	
    	//Holds dragbox bottom-left in place.
    	var scale = (loupe_scale_updated / 100) - 1;
    	loupe_window_left_updated = dragbox_left * (scale * -1);
    	loupe_window_top_updated = (dragbox_top + dragbox_height) * (scale * -1);
    }
    else if (loupe_resize_active == "southwest"){
    	//Calculate scale change.
    	loupe_scale_updated = Math.round(loupe_scale - (perc_dX - perc_dY));
    	
    	//Limit scaling between set limits.
    	clampScale();
    	
    	//Holds dragbox bottom-left in place.
    	var scale = (loupe_scale_updated / 100) - 1;
    	loupe_window_left_updated = (dragbox_left + dragbox_width) * (scale * -1);
    	loupe_window_top_updated = dragbox_top * (scale * -1);
    }
    else if (loupe_resize_active == "southeast"){
    	//Calculate scale change.
    	loupe_scale_updated = Math.round(loupe_scale - ((perc_dX + perc_dY) *-1));
    	
    	//Limit scaling between set limits.
    	clampScale();

    	//Holds dragbox top-left in place.
    	var scale = (loupe_scale_updated / 100) - 1;
    	loupe_window_left_updated = dragbox_left * (scale * -1);
    	loupe_window_top_updated = dragbox_top * (scale * -1);
    }
    
    //Calculate how much the window positioning will change on intial click upon usage of different resize buttons in sequence, and offset it.
    if (firstPass == true){
    	differenceX = loupe_window_left_updated - loupe_window_left;
    	differenceY = loupe_window_top_updated - loupe_window_top;
    	
    	//Indicate that the first position adjustment has been completed and should not be run again.
    	firstPass = false;
    }

	//Update positions.
	loupe_window.style.left = loupe_window_left_updated - differenceX + "%";
    loupe_window.style.top = loupe_window_top_updated - differenceY + "%";
    canvas_element.style.left = loupe_window_left_updated - differenceX + "%";
    canvas_element.style.top = loupe_window_top_updated - differenceY + "%";
	
    //Update scale.
    loupe_window.style.transform = 'scale(' + loupe_scale_updated + '%)';
    canvas_element.style.transform = 'scale(' + loupe_scale_updated + '%)';

    //Update scale info in the UI.
    scaleInfo();
};


//Upon mouse up:
var LoupeResizeMouseUp = (e) => {
	document.removeEventListener('mousemove', LoupeResizeMouseMove);
	document.removeEventListener('mouseup', LoupeResizeMouseUp);
	
	//Reset offset correction check.
	firstPass = true;
	
	//Update the variables for the next cycle.
    loupe_window_left = loupe_window_left_updated - differenceX;
    loupe_window_top = loupe_window_top_updated - differenceY; 
    

	//Update the global variables for use with the next mousedown event.
	loupe_scale = loupe_scale_updated;
	
	//Crop the invisible Loupe Window area to match, AFTER the Canvas has been cropped.
	skipWindowCrop = false;
	CropperWindow();
};


/* EVENTS */
//Listen to the corners, set the direction variable. 
resize_northwest.addEventListener('mousedown', LoupeResizeMouseDown, false);
resize_northwest.addEventListener('mousedown', function () {loupe_resize_active = "northwest";}, false);
resize_northeast.addEventListener('mousedown', LoupeResizeMouseDown, false);
resize_northeast.addEventListener('mousedown', function () {loupe_resize_active = "northeast";}, false);
resize_southwest.addEventListener('mousedown', LoupeResizeMouseDown, false);
resize_southwest.addEventListener('mousedown', function () {loupe_resize_active = "southwest";}, false);
resize_southeast.addEventListener('mousedown', LoupeResizeMouseDown, false);
resize_southeast.addEventListener('mousedown', function () {loupe_resize_active = "southeast";}, false);
resize_scaleinfo.addEventListener('click', ResetLoupeScale, false);
resize_scaleinfo.addEventListener('click', resetResize, false);
resize_scaleinfo.addEventListener('mouseover', scaleInfoOnMouseOver, false);
resize_scaleinfo.addEventListener('mouseout', scaleInfoMouseOut, false);


/*************************************
*		CONTROL BAR BUTTON
*************************************/

var button_active = false;

// Toggle GUI button visual state.
var ToggleButton = () => 
	{
    button_active = !button_active;
    if (button_active) 
    {
        gui_button.style.backgroundColor = "var(--color-background-button-icon-overlay-hover)";
    } else {
        gui_button.style.backgroundColor = "transparent";
    }
}

// Reset GUI button visual state.
var ResetButton = () => {
    if (button_active) ToggleButton();
}

// GUI Button in the Player.
var gui_button_div = document.createElement('div');
var gui_button     = document.createElement('button');
gui_button.style.color = "white";
gui_button.style.lineHeight  = "var(--button-size-default)";
gui_button.innerText = '\xa0├\xa0:+:\xa0┤\xa0';

// Append.
gui_button_div.appendChild(gui_button);


/*************************************
*		CONTROL BAR BUTTON > EVENTS
*************************************/

/* Clicks on the control bar button. */
//Disable Zoomer, Keystoner & Loupe.
gui_button.addEventListener("click", ToggleZoomer, false);
gui_button.addEventListener("click", ToggleKeystoner, false);
gui_button.addEventListener("click", ToggleLoupe, false);
gui_button.addEventListener("click", ToggleButton, false);
//Disable & Reset Zoomer, Keystoner, Loupe.
gui_button.addEventListener("dblclick", ResetZoomer, false);
gui_button.addEventListener("dblclick", ResetKeystoner, false);
gui_button.addEventListener("dblclick", ResetLoupe, false);
gui_button.addEventListener("dblclick", ResetButton, false);


/*************************************
*		CONTAINER
*************************************/
var container = document.createElement('div');
container.className = 'zoomer-container-all';

container.appendChild(zoomer_overlay);
container.appendChild(keystoner_overlay);
container.appendChild(loupe_overlay);

/*************************************
*		DOCUMENT > EVENTS
*************************************/

//Update the dimensions of Overlay after the initialized action has finished executing.
var updateDimensions_withTimeout = () => {
	setTimeout(() => {
		updateDimensions();
	}, 10)
}

//Whenever the left or right pane are collapsed or extended, refit the dimensions.
setTimeout(() => {
	var left_collapse = document.getElementsByClassName("collapse-toggle")[0];
	left_collapse.addEventListener("click", updateDimensions_withTimeout, false);
	var right_collapse = document.getElementsByClassName("right-column__toggle-visibility")[0];
	right_collapse.addEventListener("click", updateDimensions_withTimeout, false);
}, 5000)

//Whenever the document is resized, the width of the Overlay is adjusted.
window.addEventListener('resize', function(event) {
    updateDimensions();
}, true);


var oldHref = document.location.href;

// Hacked Updates
setInterval(() => { //The code to be executed after every *-number milliseconds. 
    if (oldHref != document.location.href) {
        oldHref = document.location.href;
        twitch_vid = twitch_video_ref = twitch_ctrl_bar = null
    }
    if (!twitch_vid) {
		twitch_vid = document.getElementsByTagName('video')[0];
        twitch_vid.setAttribute("class", "video-original");
        twitch_vid.setAttribute("data-zoomer-attached", true);
        ResetZoomer();      //Zoomer to default.
        ResetKeystoner();   //Keystoner to default.
        ResetLoupe();       //Loupe to default.
        ResetButton();      //Button to default.
    }
    if (!twitch_video_ref) {
        twitch_video_ref = document.querySelectorAll(".video-ref")[0];
        twitch_video_ref.setAttribute("data-zoomer-attached", true);
        twitch_video_ref.append(container); //Appends the Zoomer, Keystoner, Loupe UI.
    }
    if (!twitch_ctrl_bar) 
    {   //Twitch controls on the video player.
        twitch_ctrl_bar = document.querySelectorAll(".player-controls__right-control-group")[0]; // Queries the right button group on the player.
        twitch_ctrl_bar.setAttribute("data-zoomer-attached", true);
        twitch_ctrl_bar.prepend(gui_button_div); //Prepends the Button UI.
    }
}, 5000); // Updates it every 5 seconds.

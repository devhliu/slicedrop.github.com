// the viewers
jQuery(function() {

  

  // create the 2d sliders
  jQuery("#yellow_slider").slider({
    slide: volumeslicing
  });
  jQuery("#yellow_slider .ui-slider-handle").unbind('keydown');
  
  jQuery("#red_slider").slider({
    slide: volumeslicing
  });
  jQuery("#red_slider .ui-slider-handle").unbind('keydown');
  
  jQuery("#green_slider").slider({
    slide: volumeslicing
  });
  jQuery("#green_slider .ui-slider-handle").unbind('keydown');
  
});

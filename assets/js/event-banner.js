// Auto-hide event banners after a specified date.
// Any .event-banner element with a data-hide-after="YYYY-MM-DD" attribute
// will be removed once the current local date is >= that date.
(function(){
  function shouldHide(hideAfterStr){
    if(!hideAfterStr) return false;
    var parts = hideAfterStr.split('-');
    if(parts.length !== 3) return false;
    var y = parseInt(parts[0],10), m = parseInt(parts[1],10)-1, d = parseInt(parts[2],10);
    if(isNaN(y)||isNaN(m)||isNaN(d)) return false;
    var now = new Date();
    var hideDate = new Date(y,m,d); // local midnight
    return now >= hideDate;
  }
  function process(){
    document.querySelectorAll('.event-banner').forEach(function(banner){
      var hideAfter = banner.getAttribute('data-hide-after');
      if(shouldHide(hideAfter)){
        if(banner.parentNode) banner.parentNode.removeChild(banner);
      }
    });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', process);
  } else {
    process();
  }
})();

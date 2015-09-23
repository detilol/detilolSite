'user stict'

var lwip = require('lwip');

exports.getSize = function(filePath){
    lwip.open(filePath, function(err, image) {
      if(err) throw err;
      var imgWidth = image.width(),
      imgHeight = image.height();
      console.log('width:',imgWidth,' height:', imgHeight);
      return 'Hello Photobank from '+filePath;
    });
}
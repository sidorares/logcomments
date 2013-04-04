

var transform = require('./index.js').transform;

/*
var src = '(' + function () {
    var xs = [ 1, 2, [ 3, 4 ] ];
    if (1) {
      ;
      // no comment  :
      ;
    }
    var ys = [ 5, 6 ];
    // comment     .
    console.dir([ xs, ys ]);
} + ')()';
*/

var src = require('fs').readFileSync(process.argv[2], 'utf-8');

console.log(src);
console.log('======================================');
console.log(transform(src) );

var falafel = require('falafel');

function visitChilds(node, visitor) {
  var keys = Object.keys(node);
  var keyId = 0;
  var visitorRet;
  for(keyId = 0; keyId < keys.length; keyId++) {
    var key = keys[keyId];
    if (key === 'parent') return;
    var child = node[key];
    if (Array.isArray(child)) {
      for (var c = 0; c < child.length; ++c) {
        var ele = child[c];
        if (ele && typeof ele.type === 'string') {
          visitorRet = visitor(ele, node);
          if (visitorRet)
            return visitorRet;
        }
      }
    } else {
      if (child && typeof child.type === 'string') {
        visitorRet = visitor(child, node);
        if (visitorRet)
          return visitorRet;
      }
    }
  }
}

function findTreePosition(comment) {
  comment.path = [];
  while(1) {
    var next = visitChilds(comment.parent, function (child) {
      if (child.range[0] <= comment.range[0] && child.range[1] >= comment.range[1]) {
        comment.path.push(child.type);
        comment.parent = child;
        comment.left = comment.right = null;
        return true;
      }
      if (child.range[1] <= comment.range[0])
        if(!comment.left || comment.left.range[1] < child.range[1])
          comment.left = child;
      if (child.range[0] >= comment.range[1])
        if (!comment.right || comment.right.range[0] > child.range[0])
          comment.right = child;
    });
    if (next !== true)
       break;
  }
}

function transformComments(content, commentTransformer) {
  return falafel(content, { comment: true }, function(node) {
    if (['Line', 'Block'].indexOf(node.type) != -1) {
      findTreePosition(node);
      commentTransformer(node);
    }
  });
}

function escape(str) {
  var res = '';
  res = res.replace(/\\/g, '\\\\');
  res = str.replace(/\n/g, '\\n');
  res = res.replace(/"/g, '\\"');
  return res;
}

function defaultCommentTransformer(node) {
  var left = node.left ? "Left: " + node.left.type + "; " : "Left: null; ";
  var right = node.right ? "Right: " + node.right.type + "; " : "Right: null; ";
  var parent = node.parent ? "Parent: " + node.parent.type + "; " : "Parent: null; ";
  var start = node.type == 'Line' ? '//' : '/*';
  var end = node.type == 'Line' ? '' : '*/';
  node.update([start, node.value, parent, left, right, node.path.join('>'), end].join(''));
  //if (node.parent.type == 'BlockStatement')
  //  node.update('console.log("' + escape(node.value) + '");');
}

var oldJsHandler = require.extensions['.js'];

function setupCommentTransformer(commenTransformer) {
  require.extensions['.js'] = function(module, filename) {
    try {
      var content = require('fs').readFileSync(filename, 'utf8');
      var transformed = transformComments(content, commentTransformer);
      module._compile(transformed.toString(), filename);
    } catch(e) {
      return oldJsHandler(module, filename)
    }
  };
}

if (process.env.TRANSFORM_COMMENTS) {
  setupCommentTransformer(defaultCommenTransformer);
}
module.exports = function(commentTransformer) {
  setupCommentTransformer(commenTransformer);
}

module.exports.transform = function(content, transformer) {
  if (!transformer)
    transformer = defaultCommentTransformer;
  return transformComments(content, transformer);
}

"use strict";

// TODO: newlines need to be better preserved when markdown is parsed so it matches when renders back
var renderNodes = function(block) {

  var attrs;
  var info_words;
  var tagname;
  var walker = block.walker();
  var event, node, entering;
  var buffer = "";
  var lastOut = "\n";
  var grandparent;
  var lastLink = null;
  var listItemNum = 1;
  var lastListType = null;

  var out = function(s) {
    buffer += s;
    lastOut = s;
  };

  var cr = function(num) {
    if (lastOut !== '\n' && lastOut !== '\n\n') {
      buffer += '\n'.repeat(num || 1);
      lastOut = '\n'.repeat(num || 1);
    }
  };

  var options = this.options;

  if (options.time) { console.time("rendering"); }

  while ((event = walker.next())) {
    entering = event.entering;
    node = event.node;

    attrs = [];

    // Attempt custom user rendering before anything
    var customRendered =
      options.customRender &&
      options.customRender(event, {out: out, cr: cr}, options);

    if (!customRendered) {

      switch (node.type) {
        case 'Text':
          out(node.literal);
          break;

        case 'Softbreak':
          out('\n');
          break;

        case 'Hardbreak':
          out('\\');
          cr();
          break;

        case 'Emph':
          out('*');
          break;

        case 'Strong':
          out('**');
          break;

        case 'Html':
          out(node.literal);
          break;

        case 'Link':
          if (entering) {
            lastLink = node;
            out('[');
          } else {
            out(
              '](' +
              lastLink.destination +
              (lastLink.title ? ' ' + lastLink.title : '') +
              ')'
            );
          }
          break;

        case 'Image':
          if (entering) {
            lastLink = node;
            out('![');
          } else {
            out(
              '](' +
              lastLink.destination +
              (lastLink.title ? ' ' + lastLink.title : '') +
              ')'
            );
          }
          break;

        case 'Code':
          out('`' + node.literal + '`');
          break;

        case 'Document':
          break;

        case 'Paragraph':
          grandparent = node.parent.parent;
          if (grandparent !== null &&
            grandparent.type === 'List') {
            if (grandparent.listTight) {
              break;
            }
          }
          if (entering) {
            cr();
          } else {
            cr(2)
          }
          break;

        case 'BlockQuote':
          // TODO: Implement
          break;

        case 'Item':
          if (entering) {
            // TODO: Does this need to go a,b,c after indenting?
            out(lastListType === 'Bullet' ? '- ' : listItemNum + ' ');
            listItemNum += 1;
          } else {
            cr();
          }
          break;

        case 'List':
          if (entering) {
            lastListType = node.listType;
            listItemNum = 1;
            cr();
          } else {
            cr(2);
          }
          break;

        case 'Header':
          if (entering) {
            cr();
            out('#'.repeat(node.level) + ' ');
          } else {
            cr();
          }
          break;

        case 'CodeBlock':
          // TODO: Implement
          break;

        case 'HtmlBlock':
          cr();
          out(node.literal);
          cr();
          break;

        case 'HorizontalRule':
          cr();
          out('---');
          cr(2)
          break;

        default:
          // Oops! Node wasn't rendered
          throw "Unknown node type " + node.type;
      }

    }
  }

  // Cleanup surrounding newlines (probably needs to go behind an option)
  buffer = buffer.replace(/\n+$/, " ");
  buffer = buffer.replace(/^\n+/, " ");

  if (options.time) { console.timeEnd("rendering"); }
  return buffer;
};

// The HtmlRenderer object.
function MarkdownRenderer(options){
  return {
    options: options || {},
    render: renderNodes
  };
}

module.exports = MarkdownRenderer;

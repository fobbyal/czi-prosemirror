// @flow

import {PARAGRAPH, CODE_BLOCK} from './NodeNames';
import {Schema} from 'prosemirror-model';
import {Transform} from 'prosemirror-transform';
import compareNumber from './compareNumber';
import isListNode from './isListNode';

export default function toggleCodeBlock(
  tr: Transform,
  schema: Schema,
): Transform {
  const {nodes} = schema;
  const {selection, doc} = tr;
  const codeBlock = nodes[CODE_BLOCK];
  const paragraph = nodes[PARAGRAPH];
  if (!selection || !doc || !codeBlock || !paragraph) {
    return tr;
  }

  const poses = [];
  const {from, to} = tr.selection;
  let startWithCodeBlock = null;
  doc.nodesBetween(from, to, (node, pos) => {
    const nodeType = node.type;
    if (startWithCodeBlock === null) {
      startWithCodeBlock = nodeType === codeBlock;
    }
    poses.push(pos);
    return !isListNode(node);
  });

  // Update from the bottom to avoid disruptive changes in pos.
  poses.sort(compareNumber).reverse().forEach(pos => {
    tr = setCodeBlockNodeEnabled(
      tr,
      schema,
      pos,
      startWithCodeBlock ? false : true,
    );
  });
  return tr;
}

function setCodeBlockNodeEnabled(
  tr: Transform,
  schema: Schema,
  pos: number,
  enabled: boolean,
): Transform {
  const {doc} = tr;
  if (!doc) {
    return tr;
  }

  const node = doc.nodeAt(pos);
  if (!node) {
    return tr;
  }
  if (isListNode(node)) {
    return tr;
  }

  const {nodes} = schema;
  const codeBlock = nodes[CODE_BLOCK];
  const paragraph = nodes[PARAGRAPH];
  if (!enabled && paragraph && node.type === codeBlock) {
    tr = tr.setNodeMarkup(
      pos,
      paragraph,
      node.attrs,
      node.marks,
    );
  } else if (enabled && codeBlock && node.type === paragraph) {
    tr = tr.setNodeMarkup(
      pos,
      codeBlock,
      node.attrs,
      node.marks,
    );
  }
  return tr;
}

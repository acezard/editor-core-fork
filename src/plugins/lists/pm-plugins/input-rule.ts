import { InputRule, wrappingInputRule } from 'prosemirror-inputrules';
import { NodeType, Schema, NodeRange, Node as PMNode } from 'prosemirror-model';
import { Plugin, EditorState } from 'prosemirror-state';
import {
  createInputRule as defaultCreateInputRule,
  defaultInputRuleHandler,
  leafNodeReplacementCharacter,
  instrumentedInputRule,
  InputRuleWithHandler,
} from '../../../utils/input-rules';
import {
  ruleWithAnalytics,
  ACTION,
  ACTION_SUBJECT,
  ACTION_SUBJECT_ID,
  EVENT_TYPE,
  INPUT_METHOD,
} from '../../analytics';

export function createInputRule(regexp: RegExp, nodeType: NodeType) {
  return wrappingInputRule(
    regexp,
    nodeType,
    {},
    (_, node) => node.type === nodeType,
  ) as InputRuleWithHandler;
}

export const insertList = (
  state: EditorState,
  listType: NodeType,
  start: number,
  end: number,
) => {
  // To ensure that match is done after HardBreak.
  const { hardBreak } = state.schema.nodes;
  if (state.doc.resolve(start).nodeAfter!.type !== hardBreak) {
    return null;
  }

  // To ensure no nesting is done.
  if (state.doc.resolve(start).depth > 1) {
    return null;
  }

  // Split at the start of autoformatting and delete formatting characters.
  let tr = state.tr.delete(start, end).split(start);

  // If node has more content split at the end of autoformatting.
  let currentNode = tr.doc.nodeAt(start + 1) as PMNode;
  tr.doc.nodesBetween(start, start + currentNode!.nodeSize, (node, pos) => {
    if (node.type === hardBreak) {
      tr = tr.split(pos + 1).delete(pos, pos + 1);
    }
  });

  // Wrap content in list node
  const { listItem } = state.schema.nodes;
  const position = tr.doc.resolve(start + 2);
  let range = position.blockRange(position)!;
  tr = tr.wrap(range as NodeRange, [{ type: listType }, { type: listItem }]);
  return tr;
};

/**
 * Create input rules for bullet list node
 *
 * @param {Schema} schema
 * @returns {InputRule[]}
 */
function getBulletListInputRules(schema: Schema): InputRule[] {
  const ruleWithBulletListAnalytics = ruleWithAnalytics(() => ({
    action: ACTION.FORMATTED,
    actionSubject: ACTION_SUBJECT.TEXT,
    actionSubjectId: ACTION_SUBJECT_ID.FORMAT_LIST_BULLET,
    eventType: EVENT_TYPE.TRACK,
    attributes: {
      inputMethod: INPUT_METHOD.FORMATTING,
    },
  }));

  // NOTE: we decided to restrict the creation of bullet lists to only "*"x
  const asteriskRule = defaultInputRuleHandler(
    createInputRule(/^\s*([\*\-]) $/, schema.nodes.bulletList),
    true,
  );

  const leafNodeAsteriskRule = defaultCreateInputRule(
    new RegExp(`${leafNodeReplacementCharacter}\\s*([\\*\\-]) $`),
    (state, _match, start, end) => {
      return insertList(state, schema.nodes.bulletList, start, end);
    },
    true,
  );

  return [
    ruleWithBulletListAnalytics(asteriskRule),
    ruleWithBulletListAnalytics(leafNodeAsteriskRule),
  ];
}

/**
 * Create input rules for strong mark
 *
 * @param {Schema} schema
 * @returns {InputRule[]}
 */
function getOrderedListInputRules(schema: Schema): InputRule[] {
  const ruleWithOrderedListAnalytics = ruleWithAnalytics(() => ({
    action: ACTION.FORMATTED,
    actionSubject: ACTION_SUBJECT.TEXT,
    actionSubjectId: ACTION_SUBJECT_ID.FORMAT_LIST_NUMBER,
    eventType: EVENT_TYPE.TRACK,
    attributes: {
      inputMethod: INPUT_METHOD.FORMATTING,
    },
  }));

  // NOTE: There is a built in input rule for ordered lists in ProseMirror. However, that
  // input rule will allow for a list to start at any given number, which isn't allowed in
  // markdown (where a ordered list will always start on 1). This is a slightly modified
  // version of that input rule.
  const numberOneRule = defaultInputRuleHandler(
    createInputRule(/^(1)[\.\)] $/, schema.nodes.orderedList),
    true,
  );

  const leafNodeNumberOneRule = defaultCreateInputRule(
    new RegExp(`${leafNodeReplacementCharacter}(1)[\\.\\)] $`),
    (state, _match, start, end) => {
      return insertList(state, schema.nodes.orderedList, start, end);
    },
    true,
  );

  return [
    ruleWithOrderedListAnalytics(numberOneRule),
    ruleWithOrderedListAnalytics(leafNodeNumberOneRule),
  ];
}

export default function inputRulePlugin(schema: Schema): Plugin | undefined {
  const rules: InputRule[] = [];

  if (schema.nodes.bulletList) {
    rules.push(...getBulletListInputRules(schema));
  }

  if (schema.nodes.orderedList) {
    rules.push(...getOrderedListInputRules(schema));
  }

  if (rules.length !== 0) {
    return instrumentedInputRule('lists', { rules });
  }

  return;
}

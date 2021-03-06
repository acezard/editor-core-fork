import {
  createProsemirrorEditorFactory,
  LightEditorPlugin,
  Preset,
} from '@atlaskit/editor-test-helpers/create-prosemirror-editor';
import {
  doc,
  p,
  ul,
  li,
  ol,
} from '@atlaskit/editor-test-helpers/schema-builder';
import listPlugin from '../../..';
import { pluginKey, getDecorations } from '../../../pm-plugins/main';

describe('lists', () => {
  const createEditor = createProsemirrorEditorFactory();
  const editor = (doc: any) =>
    createEditor({
      doc,
      preset: new Preset<LightEditorPlugin>().add(listPlugin),
      pluginKey,
    });

  describe('styles', () => {
    it('should add decorations to indicate indentation level in a single nested list', () => {
      const {
        editorView: { state },
      } = editor(
        // prettier-ignore
        doc(
        ol(
          li(
            p('A'),
            ul(
              li(
                p('B'),
                ol(
                  li(
                    p('C'),
                    ul(
                      li(
                        p('D')
                      )
                    ),
                    p('C')
                  )
                )
              ),
            li(p('B'))),
          ),
          li(p('A')),
        ),
      ),
      );

      const decorations = getDecorations(state.doc).find();
      expect(decorations).toHaveLength(4); // one for each level of indentation

      const decorationAttrs = decorations.map(
        (decoration: any) => decoration.type.attrs['data-indent-level'],
      );
      ['1', '2', '3', '4'].forEach(level => {
        expect(decorationAttrs).toContain(level);
      });
    });

    it('should add decorations to indicate indentation level in multiple nested lists', () => {
      const {
        editorView: { state },
      } = editor(
        // prettier-ignore
        doc(
        ol(
          li(
            p('A'),
            ol(
              li(
                p('B'),
                ol(
                  li(
                    p('C'),
                    ol(
                      li(
                        p('D')
                      )
                    ),
                    p('C')
                  )
                )
              ),
            li(p('B'))),
          ),
          li(p('A')),
        ),
        p(''),
        ol(li(p('A')))
      ),
      );

      const firstOuterListNode = state.doc.nodeAt(0)!;
      const secondOuterListDecoration = getDecorations(state.doc).find(
        firstOuterListNode.nodeSize + 1,
      );
      expect(secondOuterListDecoration).toHaveLength(1);

      const lastDecoration = secondOuterListDecoration[0];
      const indentLevelAttr = (lastDecoration as any).type.attrs;
      expect(indentLevelAttr['data-indent-level']).toEqual('1');
    });

    it('should add decorations to indicate indentation level in multiple simple lists', () => {
      const {
        editorView: { state },
      } = editor(
        // prettier-ignore
        doc(
        ul(
          li(p('A')),
        ),
        ol(
          li(p('B')),
        ),
        ul(
          li(p('C')),
        ),
      ),
      );

      const decorations = getDecorations(state.doc).find();
      expect(decorations).toHaveLength(3);

      decorations.forEach(decoration => {
        const indentLevelAttr = (decoration as any).type.attrs;
        expect(indentLevelAttr['data-indent-level']).toEqual('1');
      });
    });

    it('should add decorations to indicate indentation level in asymmetric lists', () => {
      const {
        editorView: { state },
      } = editor(
        // prettier-ignore
        doc(
        ul(
          li(
            p('A'),
            ul(
              li(p('B'))
            ),
          ),
        ),
        ol(
          li(p('C')),
        ),
      ),
      );

      const firstOuterListNode = state.doc.nodeAt(0)!;
      const secondOuterListDecoration = getDecorations(state.doc).find(
        firstOuterListNode.nodeSize + 1,
      );
      expect(secondOuterListDecoration).toHaveLength(1);

      const lastDecoration = secondOuterListDecoration[0];
      const indentLevelAttr = (lastDecoration as any).type.attrs;
      expect(indentLevelAttr['data-indent-level']).toEqual('1');
    });
  });
});

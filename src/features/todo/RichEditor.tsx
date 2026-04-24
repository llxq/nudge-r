import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Tooltip } from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  StrikethroughOutlined,
  CodeOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import styles from "./RichEditor.module.scss";

interface Props {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  readonly?: boolean;
}

export default function RichEditor({
  content = "",
  onChange,
  placeholder = "记录详情…",
  readonly = false,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable: !readonly,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
  });

  if (!editor) return null;

  const btn = (
    title: string,
    active: boolean,
    onClick: () => void,
    icon: React.ReactNode
  ) => (
    <Tooltip title={title} mouseEnterDelay={0.5}>
      <button
        type="button"
        className={`${styles.toolBtn} ${active ? styles.toolActive : ""}`}
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      >
        {icon}
      </button>
    </Tooltip>
  );

  return (
    <div className={styles.wrap}>
      {!readonly && (
        <div className={styles.toolbar}>
          {btn("加粗", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <BoldOutlined />)}
          {btn("斜体", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <ItalicOutlined />)}
          {btn("删除线", editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), <StrikethroughOutlined />)}
          {btn("行内代码", editor.isActive("code"), () => editor.chain().focus().toggleCode().run(), <CodeOutlined />)}
          <div className={styles.divider} />
          {btn("无序列表", editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), <UnorderedListOutlined />)}
          {btn("有序列表", editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <OrderedListOutlined />)}
          <div className={styles.divider} />
          {btn("标题 1", editor.isActive("heading", { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), <span style={{ fontWeight: 700, fontSize: 12 }}>H1</span>)}
          {btn("标题 2", editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <span style={{ fontWeight: 700, fontSize: 12 }}>H2</span>)}
          <div className={styles.divider} />
          {btn("引用", editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), <span style={{ fontSize: 14, lineHeight: 1 }}>❝</span>)}
          {btn("分割线", false, () => editor.chain().focus().setHorizontalRule().run(), <MinusOutlined />)}
        </div>
      )}
      <EditorContent editor={editor} className={styles.editor} />
    </div>
  );
}

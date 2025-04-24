# tghtml

[![JSR](https://jsr.io/badges/@adriangalilea/tghtml)](https://jsr.io/@adriangalilea/tghtml)

A specialized Deno library that transforms arbitrary HTML (especially from LLMs) into Telegram-compatible HTML format.

## Why This Exists

When working with LLMs and Telegram bots, formatting text properly is surprisingly challenging:

1. **Telegram's HTML Subset**: Telegram only supports [a limited set of HTML tags](https://core.telegram.org/bots/api#html-style) for message formatting
2. **LLM Output Formatting**: LLMs often generate rich HTML that exceeds Telegram's supported elements
3. **Visual Consistency**: Users expect formatted text to appear visually similar to what they'd see in a browser

Existing solutions like [telegramify-markdown](https://github.com/skoropadas/telegramify-markdown) work well for Markdown, but HTML offers better control and structure - especially since LLMs naturally conform better to HTML/XML syntax.

## Installation

```bash
# Using JSR
deno add @adriangalilea/tghtml

# Direct import
import { transform } from "jsr:@adriangalilea/tghtml";
```

## Usage

```typescript
import { transform } from "@adriangalilea/tghtml";

// Transform HTML to Telegram-compatible format
const telegramHtml = transform(
  `<div><b>Bold text</b> in a div</div> <p>This is a paragraph.</p>`
);
// Result: "<b>Bold text</b> in a div\n\nThis is a paragraph.\n\n"
//                            ↑ Notice preserved spacing for readability

// Custom spoiler tags are converted to Telegram format
const spoilerHtml = transform(
  `<spoiler>Hidden text</spoiler>`
);
// Result: "<tg-spoiler>Hidden text</tg-spoiler>"
```

## Design Philosophy

This library follows these core principles:

1. **Preserve Content**: Never lose text content when transforming HTML
2. **Maintain Structure**: Keep the semantic structure while removing unsupported tags
3. **Be Telegram-Compliant**: Ensure output only contains [Telegram-supported HTML tags](https://core.telegram.org/bots/api#html-style)
4. **Handle Malformed Input**: Gracefully process potentially faulty HTML from LLMs
5. **Keep It Simple**: Provide a straightforward API with sensible defaults
6. **Preserve Visual Representation**: Maintain the visual experience expected by users, not just convert tags

### Visual Representation and Spacing

The library prioritizes how content will appear to end users in Telegram, not just syntactic correctness. Spacing and formatting decisions are deliberately chosen to:

- **Maintain Visual Hierarchy**: When elements like headings and paragraphs are converted, we preserve their visual distinctiveness through careful spacing and styling (e.g., `<h1>` becomes `<b><u>` with appropriate spacing)
- **Preserve Readability**: Line breaks (`\n`) and whitespace are strategically added to ensure text remains well-formatted when rendered in Telegram's interface
- **Match User Mental Model**: Users expect content to visually resemble what they'd see in a browser, even with Telegram's limited HTML subset
- **Enable Consistent Multi-Client Rendering**: Different Telegram clients may handle HTML rendering slightly differently; our spacing approach aims for the most consistent cross-client experience

These considerations go beyond simple tag conversion and are critical to making LLM-generated content feel natural within Telegram's constraints.

Note: This library has no external dependencies except for Deno DOM.

## How It Works

| Input HTML | Transformation | Result |
|------------|----------------|--------|
| Supported tags (`<b>`, `<i>`, etc.) | Preserved as-is | `<b>Bold text</b>` → `<b>Bold text</b>` |
| Non-supported tags (`<div>`, etc.) | Tag removed, content preserved | `<div>Content</div>` → `Content` |
| `<p>` tags | Removed, appropriate spacing added | `<p>Para 1</p><p>Para 2</p>` → `Para 1\n\nPara 2\n\n` |
| Heading tags (`<h1>`) | Converted to bold + underline | `<h1>Title</h1>` → `<b><u>Title</u></b>` |
| Heading tags (`<h2>`, `<h3>`, etc.) | Converted to bold | `<h2>Subtitle</h2>` → `<b>Subtitle</b>` |
| Custom `<spoiler>` tag | Converted to Telegram format | `<spoiler>Text</spoiler>` → `<tg-spoiler>Text</tg-spoiler>` |
| List items | Converted to text with bullets | `<li>Item</li>` → `• Item\n` |
| URLs without protocol | `https://` added | `<a href="example.com">` → `<a href="https://example.com">` |
| Nested structures | Processed recursively | `<div><b>Bold</b> text</div>` → `<b>Bold</b> text` |
| HTML entities | Converted to characters | `&lt;tag&gt;` → `<tag>` |
| Malformed HTML | Fixed when possible | `<b>Bold text</div>` → `<b>Bold text</b>` |

### Examples

```typescript
// Divs are removed
transform(
  `<div>Content</div>`
);
// → "Content"

// Paragraphs maintain spacing
transform(
  `<p>First paragraph</p>
   <p>Second paragraph</p>`
);
// → "First paragraph\n\nSecond paragraph\n\n"

// Headings are converted to maintain hierarchy
transform(
  `<h1>Main Title</h1>
   <h2>Subtitle</h2>
   <h3>Section</h3>`
);
// → "<b><u>Main Title</u></b>\n<b>Subtitle</b>\n<b>Section</b>"
```

#### Lists and Formatting

```typescript
// Lists are converted to text with bullets
transform(
  `<ul>
     <li>Item 1</li>
     <li>Item 2</li>
   </ul>`
);
// → "• Item 1\n• Item 2"

// Tables preserve content
transform(
  `<table>
     <tr>
       <td>Cell 1</td>
       <td>Cell 2</td>
     </tr>
   </table>`
);
// → "Cell 1 Cell 2"
```

#### Special Cases

While `<spoiler>` is not a standard html tag, it's the closest widely used. It's easier to teach an LLM to use <spoiler> rather than `<tg-spoiler>` or `<span class="tg-spoiler">`

```typescript
// Custom spoiler tag
transform(
  `<spoiler>Hidden content</spoiler>`
);
// → "<tg-spoiler>Hidden content</tg-spoiler>"

// Complex nesting
transform(
  `<div>
     <b>Bold <i>and italic</i></b>
   </div>`
);
// → "<b>Bold <i>and italic</i></b>"

// URL
transform(
  `<a href="example.com">Link</a>`
);
// → "<a href=\"https://example.com\">Link</a>"

// Malformed HTML handling
transform(
  `<div><b>Unclosed bold tag</div>`
);
// → "<b>Unclosed bold tag</b>"
```

### Reference

Supported tags:
- Bold: `<b>`, `<strong>`
- Italic: `<i>`, `<em>`
- Underline: `<u>`, `<ins>`
- Strikethrough: `<s>`, `<strike>`, `<del>`
- Spoiler: `<span class="tg-spoiler">`, `<tg-spoiler>`
- Links: `<a href="...">`
- Code: `<code>`, `<pre>`
- Blockquotes: `<blockquote>`, `<blockquote expandable>`
- Custom emoji: `<tg-emoji emoji-id="...">`

## Telegram HTML Specification

From [the official Telegram Bot API documentation](https://core.telegram.org/bots/api#html-style):

```
HTML style
To use this mode, pass HTML in the parse_mode field. The following tags are currently supported:

<b>bold</b>, <strong>bold</strong>
<i>italic</i>, <em>italic</em>
<u>underline</u>, <ins>underline</ins>
<s>strikethrough</s>, <strike>strikethrough</strike>, <del>strikethrough</del>
<span class="tg-spoiler">spoiler</span>, <tg-spoiler>spoiler</tg-spoiler>
<b>bold <i>italic bold <s>italic bold strikethrough <span class="tg-spoiler">italic bold strikethrough spoiler</span></s> <u>underline italic bold</u></i> bold</b>
<a href="http://www.example.com/">inline URL</a>
<a href="tg://user?id=123456789">inline mention of a user</a>
<tg-emoji emoji-id="5368324170671202286">👍</tg-emoji>
<code>inline fixed-width code</code>
<pre>pre-formatted fixed-width code block</pre>
<pre><code class="language-python">pre-formatted fixed-width code block written in the Python programming language</code></pre>
<blockquote>Block quotation started\nBlock quotation continued\nThe last line of the block quotation</blockquote>
<blockquote expandable>Expandable block quotation started\nExpandable block quotation continued\nExpandable block quotation continued\nHidden by default part of the block quotation started\nExpandable block quotation continued\nThe last line of the block quotation</blockquote>

Please note:

Only the tags mentioned above are currently supported.
All <, > and & symbols that are not a part of a tag or an HTML entity must be replaced with the corresponding HTML entities (< with &lt;, > with &gt; and & with &amp;).
All numerical HTML entities are supported.
The API currently supports only the following named HTML entities: &lt;, &gt;, &amp; and &quot;.
Use nested pre and code tags, to define programming language for pre entity.
Programming language can't be specified for standalone code tags.
A valid emoji must be used as the content of the tg-emoji tag. The emoji will be shown instead of the custom emoji in places where a custom emoji cannot be displayed (e.g., system notifications) or if the message is forwarded by a non-premium user. It is recommended to use the emoji from the emoji field of the custom emoji sticker.
Custom emoji entities can only be used by bots that purchased additional usernames on Fragment.
```

## License

MIT

# tghtml

[![JSR](https://jsr.io/badges/@adriangalilea/tghtml)](https://jsr.io/@adriangalilea/tghtml)

A specialized Deno library that transforms arbitrary HTML (especially from LLMs) into Telegram-compatible HTML format with opinionated styling rules.

## Why This Exists

When working with LLMs and Telegram bots, formatting text properly is surprisingly challenging:

1. **Telegram's HTML Subset**: Telegram only supports [a limited set of HTML tags](https://core.telegram.org/bots/api#html-style) for message formatting
2. **LLM Output Formatting**: LLMs often generate rich HTML that exceeds Telegram's supported elements
3. **Visual Consistency**: An LLM will format HTML bakcwards from the desired look into HTML, meaning that elements like `<p>` or `<div>` tags are often to create spacing and structure, but telegram don't support them, so we'll try to translate this expectations into new lines and consistent spacing that is intuitively consistent with the intent of the original HTML
4. **Formatting Chaos**: Without strict formatting rules, messages can become inconsistent and hard to read

Existing solutions like [telegramify-markdown](https://github.com/skoropadas/telegramify-markdown) work with limitations for Markdown, but HTML offers better control and structure - especially since LLMs naturally conform better to HTML/XML syntax.

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
  `<h1>This is a header</h1>
  <p>This is a paragraph.</p>
  <blockquote>This is a quote</blockquote>`
);
// Result: "<b><u>This is a header</u></b>\n\nThis is a paragraph.\n\n<blockquote>This is a quote</blockquote>"
//          ↑ Formatting maintains structure

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
7. **Opinionated Styling**: Apply consistent rules for spacing, newlines and formatting

### Opinionated Styling and Formatting Rules

The library takes a deliberately opinionated approach to formatting to ensure consistent, readable output:

- **Between Tags**: Newlines and whitespace between tags are normalized to follow consistent spacing patterns
- **Inside Blockquotes**: Newlines inside blockquotes are preserved to maintain their intended formatting
- **Maximum Newlines**: No more than 2 consecutive newlines are allowed anywhere to prevent excessive spacing
- **Whitespace Handling**: Excess whitespace (multiple spaces, tabs) is collapsed to a single space
- **Semantic Spacing**: Different elements get appropriate spacing (e.g., paragraphs get double newlines, blockquotes get single newlines)
- **Visual Hierarchy**: Headings and important elements maintain visual distinctiveness through careful styling

These rules are enforced throughout the transformation process to ensure that the output is always visually consistent, regardless of how messy the input HTML might be.

Note: This library has no external dependencies except for Deno DOM.

## How It Works

| Input HTML | Transformation | Result |
|------------|----------------|--------|
| Supported tags (`<b>`, `<i>`, etc.) | Preserved as-is | `<b>Bold text</b>` → `<b>Bold text</b>` |
| Non-supported tags (`<div>`, etc.) | Tag removed, content preserved | `<div>Content</div>` → `Content` |
| `<p>` tags | Removed, appropriate spacing added | `<p>Para 1</p><p>Para 2</p>` → `Para 1\n\nPara 2\n\n` |
| Heading tags (`<h1>`) | Converted to bold + underline | `<h1>Title</h1>` → `<b><u>Title</u></b>\n\n` |
| Heading tags (`<h2>`, `<h3>`, etc.) | Converted to bold | `<h2>Subtitle</h2>` → `<b>Subtitle</b>\n\n` |
| Custom `<spoiler>` tag | Converted to Telegram format | `<spoiler>Text</spoiler>` → `<tg-spoiler>Text</tg-spoiler>` |
| List items | Converted to text with bullets | `<li>Item</li>` → `• Item\n` |
| URLs without protocol | `https://` added | `<a href="example.com">` → `<a href="https://example.com">` |
| Nested structures | Processed recursively | `<div><b>Bold</b> text</div>` → `<b>Bold</b> text` |
| HTML entities | Converted to characters | `&lt;tag&gt;` → `<tag>` |
| Malformed HTML | Fixed when possible | `<b>Bold text</div>` → `<b>Bold text</b>` |
| Blockquotes | Preserved with internal newlines | `<blockquote>Line 1\nLine 2</blockquote>` → `<blockquote>Line 1\nLine 2</blockquote>` |

### Complex Examples

```typescript
// Rich content with multiple elements
transform(`
<h1>Article Title</h1>
<p>First paragraph with <b>important</b> info.</p>
<ul>
  <li>List item with <i>formatting</i></li>
  <li>Another item</li>
</ul>
<blockquote>This blockquote has
multiple lines
  with varying indentation
that are all preserved</blockquote>
<p>Final thoughts here.</p>
`);
/* Result:
"<b><u>Article Title</u></b>

First paragraph with <b>important</b> info.

• List item with <i>formatting</i>
• Another item

<blockquote>This blockquote has
multiple lines
with varying indentation
that are all preserved</blockquote>

Final thoughts here."
*/

// Handling messy input with excess whitespace
transform(`
<div>   Excess    spaces   </div>
<blockquote>   Messy
  
   indentation
     and spacing   
</blockquote>
`);
/* Result:
"Excess spaces

<blockquote>Messy

indentation
and spacing</blockquote>"
*/

// Multiple adjacent blockquotes
transform(`
<p>Intro text</p>
<blockquote>First quote
with multiple lines</blockquote>
<blockquote>Second quote
also with multiple lines</blockquote>
`);
/* Result:
"Intro text

<blockquote>First quote
with multiple lines</blockquote>
<blockquote>Second quote
also with multiple lines</blockquote>"
*/
```

### Special Cases

While `<spoiler>` is not a standard HTML tag, it's more intuitive for LLMs. It's easier to teach an LLM to use `<spoiler>` rather than `<tg-spoiler>` or `<span class="tg-spoiler">`.

```typescript
// Custom spoiler tag
transform(
  `<spoiler>Hidden content</spoiler>`
);
// → "<tg-spoiler>Hidden content</tg-spoiler>"

// Complex nesting with preserved formatting
transform(`
<div>
  <b>Bold text with <i>nested formatting</i></b>
  <blockquote>Quoted text 
  with <b>bold</b> formatting
  <i>and multiple lines</i></blockquote>
</div>
`);
/* Result:
"<b>Bold text with <i>nested formatting</i></b>

<blockquote>Quoted text
with <b>bold</b> formatting
<i>and multiple lines</i></blockquote>"
*/

// URL handling
transform(
  `<a href="example.com">Link</a> vs <a href="https://secure.org">Secure Link</a>`
);
// → "<a href=\"https://example.com\">Link</a> vs <a href=\"https://secure.org\">Secure Link</a>"

// Malformed HTML handling
transform(
  `<div><b>Unclosed bold tag</div> and <blockquote>messy quote
  with newlines</blockqote>`
);
// → "<b>Unclosed bold tag</b> and <blockquote>messy quote\nwith newlines</blockquote>"
```

### Reference

Supported tags:

- Bold: `<b>`, `<strong>`
- Italic: `<i>`, `<em>`
- Underline: `<u>`, `<ins>`
- Strikethrough: `<s>`, `<strike>`, `<del>`
- Spoiler: `<span class="tg-spoiler">`, `<tg-spoiler>`, `<spoiler>` (custom)
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

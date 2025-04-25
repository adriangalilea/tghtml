/**
 * tghtml - Tests
 * 
 * These tests verify that HTML is properly transformed into Telegram-compatible format.
 */

import { assertEquals } from "jsr:@std/assert";
import { transform } from "../mod.ts";

// === Supported Tags ===

Deno.test("Preserves supported HTML tags", () => {
  const input = "<b>Bold text</b> <i>Italic text</i>";
  const expected = "<b>Bold text</b> <i>Italic text</i>";
  assertEquals(transform(input), expected);
});

Deno.test("Preserves nested formatting tags", () => {
  const input = "<b>Bold <i>and italic</i> text</b>";
  const expected = "<b>Bold <i>and italic</i> text</b>";
  assertEquals(transform(input), expected);
});

// === Unsupported Tags ===

Deno.test("Removes unsupported tags with proper spacing", () => {
  const input = "<div>This is a div</div> <p>This is a paragraph</p>";
  const expected = "This is a div\n\nThis is a paragraph";
  assertEquals(transform(input), expected);
});

Deno.test("Preserves supported tags inside unsupported containers", () => {
  const input = "<div><b>Bold text</b> in a div</div>";
  const expected = "<b>Bold text</b> in a div";
  assertEquals(transform(input), expected);
});

// === Spoiler Handling ===

Deno.test("Converts <spoiler> tags to Telegram format", () => {
  const input = "<spoiler>Spoiler alert</spoiler>";
  const expected = "<tg-spoiler>Spoiler alert</tg-spoiler>";
  assertEquals(transform(input), expected);
});

Deno.test("Removes span tags with unsupported classes", () => {
  const input = '<span class="invalid-class">Text content</span>';
  const expected = "Text content";
  assertEquals(transform(input), expected);
});

Deno.test("Preserves tg-spoiler tags", () => {
  const input = "<tg-spoiler>Spoiler alert</tg-spoiler>";
  const expected = "<tg-spoiler>Spoiler alert</tg-spoiler>";
  assertEquals(transform(input), expected);
});

Deno.test("Preserves span tags with tg-spoiler class", () => {
  const input = '<span class="tg-spoiler">spoiler</span>';
  const expected = '<span class="tg-spoiler">spoiler</span>';
  assertEquals(transform(input), expected);
});

// === URL Handling ===

Deno.test("Adds https:// prefix to URLs without protocol", () => {
  const input = '<a href="example.com">Link</a>';
  const expected = '<a href="https://example.com">Link</a>';
  assertEquals(transform(input), expected);
});

Deno.test("Preserves URLs with existing protocols", () => {
  const input =
    '<a href="https://example.com">HTTPS Link</a> <a href="http://example.org">HTTP Link</a>';
  const expected =
    '<a href="https://example.com">HTTPS Link</a> <a href="http://example.org">HTTP Link</a>';
  assertEquals(transform(input), expected);
});

Deno.test("Preserves Telegram-specific tg:// URLs", () => {
  const input = '<a href="tg://user?id=123456789">User</a>';
  const expected = '<a href="tg://user?id=123456789">User</a>';
  assertEquals(transform(input), expected);
});

// === Special Elements ===

Deno.test("Preserves code blocks with language classes", () => {
  const input =
    '<pre><code class="language-python">print("Hello World")</code></pre>';
  const expected =
    '<pre><code class="language-python">print("Hello World")</code></pre>';
  assertEquals(transform(input), expected);
});

Deno.test("Preserves standard blockquotes", () => {
  const input = "<blockquote>Quoted text\nSecond line</blockquote>";
  const expected = "<blockquote>Quoted text\nSecond line</blockquote>";
  assertEquals(transform(input), expected);
});

Deno.test("Handles expandable blockquotes with empty attribute", () => {
  const input = "<blockquote expandable>Expandable quote\nLine 2</blockquote>";
  const expected =
    '<blockquote expandable="">Expandable quote\nLine 2</blockquote>';
  assertEquals(transform(input), expected);
});

Deno.test("Preserves custom emoji tags", () => {
  const input = '<tg-emoji emoji-id="5368324170671202286">👍</tg-emoji>';
  const expected = '<tg-emoji emoji-id="5368324170671202286">👍</tg-emoji>';
  assertEquals(transform(input), expected);
});

// === Complex Formatting ===

Deno.test("Preserves deeply nested formatting", () => {
  const input =
    '<b>bold <i>italic bold <s>italic bold strikethrough <span class="tg-spoiler">italic bold strikethrough spoiler</span></s> <u>underline italic bold</u></i> bold</b>';
  const expected =
    '<b>bold <i>italic bold <s>italic bold strikethrough <span class="tg-spoiler">italic bold strikethrough spoiler</span></s> <u>underline italic bold</u></i> bold</b>';
  assertEquals(transform(input), expected);
});

// === Error Recovery ===

Deno.test("Recovers from malformed HTML", () => {
  const input = "<div>Unclosed div <b>Bold text</i> Mismatched</div>";
  const result = transform(input);
  // Content is preserved even with tag errors
  assertEquals(result.includes("Unclosed div"), true);
  assertEquals(result.includes("Bold text"), true);
  assertEquals(result.includes("Mismatched"), true);
});

// === Visual Transformations ===

Deno.test("Transforms headings with proper hierarchy", () => {
  const input = "<h1>Main Title</h1><h2>Subtitle</h2>";
  const expected = "<b><u>Main Title</u></b>\n\n<b>Subtitle</b>";
  assertEquals(transform(input), expected);
});

Deno.test("Maintains paragraph spacing", () => {
  const input = "<p>First paragraph</p><p>Second paragraph</p>";
  const actual = transform(input);
  // Only check for double newline between paragraphs, ignore trailing newlines
  assertEquals(actual.includes("First paragraph\n\nSecond paragraph"), true);
});

Deno.test("Transforms list items to bullet points", () => {
  const input = "<ul><li>Item 1</li><li>Item 2</li></ul>";
  const expected = "• Item 1\n• Item 2";
  assertEquals(transform(input), expected);
});

// === Complex Spacing Patterns ===

Deno.test("Properly spaces content with lists", () => {
  const input = "<div>Introduction</div><ul><li>Item 1</li><li>Item 2</li></ul><p>Conclusion</p>";
  const actual = transform(input);
  
  // Check key formatting patterns
  assertEquals(actual.includes("Introduction"), true);
  assertEquals(actual.includes("• Item 1\n• Item 2"), true);
  assertEquals(actual.includes("Conclusion"), true);
  
  // Make sure there is spacing between sections
  assertEquals(/Introduction.*?• Item 1/s.test(actual), true);
  assertEquals(/Item 2.*?Conclusion/s.test(actual), true);
});

Deno.test("Handles multiple block elements with proper spacing", () => {
  const input = "<div>First block</div><div>Second block</div><p>A paragraph</p><ul><li>List item</li></ul>";
  const actual = transform(input);
  
  // Check for correct content
  assertEquals(actual.includes("First block"), true);
  assertEquals(actual.includes("Second block"), true);
  assertEquals(actual.includes("A paragraph"), true);
  assertEquals(actual.includes("• List item"), true);
  
  // Check proper double spacing between blocks
  assertEquals(actual.includes("First block\n\nSecond block"), true);
  assertEquals(actual.includes("Second block\n\nA paragraph"), true);
});

Deno.test("Properly formats spacing in lists with different content", () => {
  const input = `<div><b>How Billionaires Avoid Taxes: Buy. Borrow. Die.</b></div>
<ul>
<li>Billionaires leverage <b>equity</b> (company shares) as collateral for loans instead of selling assets, avoiding capital gains taxes.</li>
<li>Banks profit from interest, so they rarely demand repayment as long as net worth grows.</li>
<li>If collateral value drops, shell companies or favorable tax codes are used to mitigate losses.</li>
<li>At death, assets get a <b>"step-up cost basis"</b>—resetting their value to current market price, erasing unrealized gains and taxes.</li>
</ul>
<blockquote>"Why pay capital gains tax if you never realize the gain?"</blockquote>
<i>Generic Art Dad</i>`;

  const expected = `<b>How Billionaires Avoid Taxes: Buy. Borrow. Die.</b>

• Billionaires leverage <b>equity</b> (company shares) as collateral for loans instead of selling assets, avoiding capital gains taxes.
• Banks profit from interest, so they rarely demand repayment as long as net worth grows.
• If collateral value drops, shell companies or favorable tax codes are used to mitigate losses.
• At death, assets get a <b>"step-up cost basis"</b>—resetting their value to current market price, erasing unrealized gains and taxes.

<blockquote>"Why pay capital gains tax if you never realize the gain?"</blockquote>
<i>Generic Art Dad</i>`;
  assertEquals(transform(input), expected);
});

Deno.test("Stress test: handles messy whitespace and newlines in blockquotes", () => {
  const input = `<blockquote>   Line with leading spaces


  
  Too many newlines
   
  \t More garbage spacing   
</blockquote><p>   Next    paragraph with    spaces   </p>
<blockquote>Another blockquote \n with explicit newline characters</blockquote>`;

  const expected = `<blockquote>Line with leading spaces

Too many newlines

More garbage spacing</blockquote>
Next paragraph with spaces

<blockquote>Another blockquote
with explicit newline characters</blockquote>`;
  assertEquals(transform(input), expected);
});

Deno.test("Stress test: preserves newlines in multiple adjacent blockquotes", () => {
  const input = `<div>Some text</div>
<blockquote>First blockquote
with newlines
that should be preserved</blockquote>

<blockquote>Second blockquote
with its own newlines
that should also be preserved</blockquote>

<i>Italic text after</i>`;

  const expected = `Some text

<blockquote>First blockquote
with newlines
that should be preserved</blockquote>
<blockquote>Second blockquote
with its own newlines
that should also be preserved</blockquote>
<i>Italic text after</i>`;
  assertEquals(transform(input), expected);
});

Deno.test("Stress test: complex nested elements with newlines", () => {
  const input = `<div>Outside text
 with newlines

 that should be normalized</div>
<blockquote><b>Bold text</b>
 with newlines
 inside blockquote
 <i>
   and nested formatting
   with more newlines
 </i></blockquote>`;

  const expected = `Outside text with newlines that should be normalized

<blockquote><b>Bold text</b>
with newlines
inside blockquote
<i>and nested formatting with more newlines</i></blockquote>`;
  assertEquals(transform(input), expected);
});

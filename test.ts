/**
 * tghtml - Tests
 * 
 * These tests verify that HTML is properly transformed into Telegram-compatible format.
 */

import { assertEquals } from "jsr:@std/assert";
import { transform } from "./mod.ts";

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
  const expected = "This is a div\n\nThis is a paragraph\n\n";
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
  const expected = "<b><u>Main Title</u></b>\n<b>Subtitle</b>";
  assertEquals(transform(input), expected);
});

Deno.test("Maintains paragraph spacing", () => {
  const input = "<p>First paragraph</p><p>Second paragraph</p>";
  const expected = "First paragraph\n\nSecond paragraph\n\n";
  assertEquals(transform(input), expected);
});

Deno.test("Transforms list items to bullet points", () => {
  const input = "<li>Item 1</li><li>Item 2</li>";
  const expected = "• Item 1\n• Item 2\n";
  assertEquals(transform(input), expected);
});

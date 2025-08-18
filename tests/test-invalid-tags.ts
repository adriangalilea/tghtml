import { assertEquals } from "https://deno.land/std@0.220.0/assert/mod.ts";
import { transform } from "../mod.ts";

Deno.test("Invalid HTML tags - numeric tags like <1mb>", () => {
  const input = "The file size is <1mb> which is small.";
  const expected = "The file size is 1mb which is small."; // Tag stripped, content kept
  const result = transform(input);
  assertEquals(result, expected);
});

Deno.test("Invalid HTML tags - mixed valid and invalid", () => {
  const input = "<b>Important:</b> The file is <1mb> and <small>tiny</small>.";
  const expected = "<b>Important:</b> The file is 1mb and smalltiny/small."; // < and > stripped from invalid tags
  const result = transform(input);
  assertEquals(result, expected);
});

Deno.test("Invalid HTML tags - comparison operators", () => {
  const input = "If x<5 and y>10 then <b>proceed</b>";
  const expected = "If x5 and y10 then <b>proceed</b>"; // Tags stripped, content kept
  const result = transform(input);
  assertEquals(result, expected);
});

Deno.test("Valid HTML tags should remain unchanged", () => {
  const input = "<b>Bold</b> <i>Italic</i> <a href='test.com'>Link</a>";
  const expected = "<b>Bold</b> <i>Italic</i> <a href=\"https://test.com\">Link</a>";
  const result = transform(input);
  assertEquals(result, expected);
});

Deno.test("Complex invalid tags", () => {
  const input = "Memory usage: <256mb allocated> and <b>running</b>";
  const expected = "Memory usage: 256mb allocated and <b>running</b>"; // Tag stripped, content kept
  const result = transform(input);
  assertEquals(result, expected);
});

Deno.test("Self-closing invalid tags", () => {
  const input = "Use <br/> for breaks but <1mb/> is invalid";
  const expected = "Use \nfor breaks but 1mb/ is invalid"; // Tag stripped, content kept
  const result = transform(input);
  assertEquals(result, expected);
});
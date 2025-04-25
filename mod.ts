import { DOMParser, Element as DOMElement, Node } from "jsr:@b-fuze/deno-dom@0.1.49";

// Constants for Telegram HTML support
const TELEGRAM_ALLOWED_TAGS = [
  'b', 'strong',
  'i', 'em',
  'u', 'ins',
  's', 'strike', 'del',
  'span', // Only with tg-spoiler class
  'tg-spoiler',
  'a',
  'code',
  'pre',
  'blockquote',
  'tg-emoji'
];

// Map of allowed attributes for each tag
const TELEGRAM_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  'a': ['href'],
  'span': ['class'], // For tg-spoiler class
  'blockquote': ['expandable'],
  'code': ['class'], // For language-* class
  'tg-emoji': ['emoji-id']
};

/**
 * Transforms HTML into Telegram-compatible format with opinionated spacing.
 * 
 * @param html HTML string to transform
 * @param debug Enable debug output
 * @returns Telegram-compatible HTML with consistent formatting
 */
export function transform(html: string, debug = false): string {
  try {
    // Handle empty input
    if (!html.trim()) {
      return "";
    }
    
    // Handle plain text (not HTML)
    if (!html.includes("<") || !html.includes(">")) {
      return sanitizeTextOnly(html);
    }
    
    // Parse HTML to DOM - we'll handle whitespace in the processing functions
    const dom = parseHTML(html.trim());
    if (!dom) {
      return sanitizeTextOnly(html);
    }
    
    // Process HTML
    const result = processHTML(dom, debug);
    return result.trim();
  } catch (error) {
    console.error("Error processing HTML:", error);
    return sanitizeTextOnly(html);
  }
}

/**
 * Transform parsed HTML DOM into Telegram-compatible format
 */
function processHTML(dom: DOMElement, debug = false): string {
  let output = "";
  
  // Process each node in the DOM
  for (const node of Array.from(dom.childNodes)) {
    const nodeOutput = processNode(node);
    output += nodeOutput;
  }
  
  // Clean up any double+ newlines and remove stray spaces at line beginnings
  const cleanedOutput = output
    .replace(/\n{3,}/g, '\n\n')  // No more than 2 consecutive newlines
    .replace(/\n +/g, '\n');     // Remove leading spaces after newlines
  
  return cleanedOutput;
}

/**
 * Process a single node and convert it to Telegram-compatible HTML
 */
function processNode(node: Node): string {
  // Handle text nodes directly
  if (node.nodeType === 3) { // Text node
    const text = node.textContent || '';
    // Check if we're in a blockquote (parent element is blockquote)
    const parentElement = node.parentElement;
    const isInBlockquote = parentElement && parentElement.tagName.toLowerCase() === 'blockquote';
    
    if (isInBlockquote) {
      // For blockquotes: preserve newlines, normalize spaces, limit consecutive newlines to 2
      const normalized = text
        .replace(/[ \t]+/g, ' ')         // Convert multiple spaces/tabs to single space
        .replace(/\n[ \t]+/g, '\n')      // Remove leading spaces after newlines
        .replace(/[ \t]+\n/g, '\n')      // Remove trailing spaces before newlines
        .replace(/\n{3,}/g, '\n\n');     // Limit to max 2 consecutive newlines
      
      return normalized;
    } else {
      // For all other text nodes: normalize whitespace to single spaces
      const normalized = text.replace(/\s+/g, ' ');
      return normalized;
    }
  }
  
  // Skip non-element nodes
  if (node.nodeType !== 1) {
    return '';
  }
  
  const element = node as DOMElement;
  const tagName = element.tagName.toLowerCase();
  
  // Process content of the node
  let content = '';
  for (const child of Array.from(element.childNodes)) {
    content += processNode(child);
  }
  
  // Handle specific element types
  return formatElement(tagName, content.trim(), element);
}

/**
 * Format an element based on its tag and content
 */
function formatElement(tagName: string, content: string, element: DOMElement): string {
  // Handle special tag formatting
  
  // Headings
  if (tagName === 'h1') {
    return `<b><u>${content}</u></b>\n\n`;
  } 
  
  if (['h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
    return `<b>${content}</b>\n\n`;
  }
  
  // Lists - special handling for list containers
  if (tagName === 'ul' || tagName === 'ol') {
    // Handle each list item separately
    const formattedContent = formatListItems(element);
    return formattedContent + "\n\n";
  }
  
  if (tagName === 'li') {
    return `• ${content}`;
  }
  
  // Block elements with double newline after
  if (['div', 'p', 'section', 'article', 'header', 'footer'].includes(tagName)) {
    return `${content}\n\n`;
  }
  
  // Blockquote - gets single newline
  if (tagName === 'blockquote') {
    const formatted = formatAllowedTag(tagName, content, element);
    return formatted + '\n';
  }
  
  // Single newline elements
  if (['br'].includes(tagName)) {
    return "\n";
  }
  
  // Allowed Telegram tags
  if (TELEGRAM_ALLOWED_TAGS.includes(tagName)) {
    return formatAllowedTag(tagName, content, element);
  }
  
  // Custom tags
  if (tagName === 'spoiler') {
    return `<tg-spoiler>${content}</tg-spoiler>`;
  }
  
  // Default: just return the content 
  return content;
}

/**
 * Special handling for list items to format them with bullet points
 */
function formatListItems(listContainer: DOMElement): string {
  let result = '';
  
  // Process each list item with bullet points
  for (const node of Array.from(listContainer.childNodes)) {
    if (node.nodeType === 1) {
      const element = node as DOMElement;
      const tagName = element.tagName.toLowerCase();
      
      if (tagName === 'li') {
        // Process the list item's content
        let content = '';
        for (const child of Array.from(element.childNodes)) {
          content += processNode(child);
        }
        
        // Add bullet point and newline
        if (result) {
          result += '\n';
        }
        result += `• ${content.trim()}`;
      }
    }
  }
  
  return result;
}

/**
 * Format allowed Telegram tags with attributes 
 */
function formatAllowedTag(tagName: string, content: string, element: DOMElement): string {
  // Special case for span - only allow tg-spoiler class
  if (tagName === 'span') {
    const classAttr = element.getAttribute('class');
    if (classAttr !== 'tg-spoiler') {
      return content;
    }
  }
  
  // Start building the tag
  let result = `<${tagName}`;
  
  // Add allowed attributes
  const allowedAttributes = TELEGRAM_ALLOWED_ATTRIBUTES[tagName] || [];
  for (const attr of Array.from(element.attributes)) {
    if (allowedAttributes.includes(attr.name)) {
      // Special handling for href in <a> tags
      if (tagName === 'a' && attr.name === 'href') {
        const href = attr.value;
        if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('tg://')) {
          result += ` href="https://${href}"`;
          continue;
        }
      }
      
      // Special handling for expandable blockquotes
      if (tagName === 'blockquote' && attr.name === 'expandable') {
        result += ` expandable=""`;
        continue;
      }
      
      result += ` ${attr.name}="${attr.value}"`;
    }
  }
  
  // Close tag opening
  result += `>${content}`;
  
  // Add closing tag
  result += `</${tagName}>`;
  
  return result;
}

/**
 * Parse HTML string into a DOM
 */
function parseHTML(html: string): DOMElement | null {
  const parser = new DOMParser();
  const document = parser.parseFromString(`<!DOCTYPE html><html><body>${html}</body></html>`, "text/html");
  
  if (!document || !document.body) {
    return null;
  }
  
  return document.body;
}

/**
 * Sanitizes text content for safety
 */
function sanitizeTextOnly(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
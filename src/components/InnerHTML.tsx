import { onMount } from "solid-js"
import { FormComponentBase } from "../FormType"

const InnerHTML: FormComponentBase = props => {
  let containerRef: HTMLDivElement | undefined;

  onMount(() => {
    if (containerRef) {
      // Use Shadow DOM to isolate inline styles from affecting the rest of the page
      const shadow = containerRef.attachShadow({ mode: 'open' });

      // Copy all stylesheets from the document into the shadow root
      // This ensures Tailwind classes work inside the shadow DOM
      const styleSheets = document.querySelectorAll('style, link[rel="stylesheet"]');
      styleSheets.forEach(sheet => {
        shadow.appendChild(sheet.cloneNode(true));
      });

      // Create a container for the HTML content
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = props.component.label;
      shadow.appendChild(contentDiv);
    }
  });

  return (
    <div ref={containerRef} />
  )
}

export default InnerHTML
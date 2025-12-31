import { onMount } from "solid-js"
import { FormComponentBase } from "../FormType"

const InnerHTML: FormComponentBase = props => {
  let containerRef: HTMLDivElement | undefined;

  onMount(() => {
    if (containerRef) {
      // Use Shadow DOM to isolate inline styles from affecting the rest of the page
      const shadow = containerRef.attachShadow({ mode: 'open' });
      shadow.innerHTML = props.component.label;
    }
  });

  return (
    <div ref={containerRef} />
  )
}

export default InnerHTML
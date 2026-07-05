import { useEffect, useId, useRef, useState } from 'react';
import mermaid from 'mermaid';
import styles from './Mermaid.module.css';

mermaid.initialize({ startOnLoad: false, theme: 'default' });

export type MermaidProps = {
  chart: string;
};

type RenderState =
  | { status: 'loading' }
  | { status: 'ok'; svg: string; bindFunctions: ((el: Element) => void) | undefined }
  | { status: 'error'; message: string };

export const Mermaid = ({ chart }: MermaidProps) => {
  const id = useId().replace(/:/g, '');
  const [state, setState] = useState<RenderState>({ status: 'loading' });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    mermaid.render(`mermaid-${id}`, chart)
      .then(({ svg, bindFunctions }) => {
        if (!cancelled) setState({ status: 'ok', svg, bindFunctions });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  useEffect(() => {
    if (state.status === 'ok' && containerRef.current) {
      state.bindFunctions?.(containerRef.current);
    }
  }, [state]);

  if (state.status === 'error') {
    return <pre className={styles.error}>Failed to render diagram: {state.message}</pre>;
  }

  if (state.status === 'loading') {
    return <div className={styles.placeholder} aria-hidden="true" />;
  }

  return <div ref={containerRef} className={styles.view} dangerouslySetInnerHTML={{ __html: state.svg }} />;
};

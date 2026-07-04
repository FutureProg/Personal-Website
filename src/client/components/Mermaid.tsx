import { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';
import styles from './Mermaid.module.css';

mermaid.initialize({ startOnLoad: false, theme: 'default' });

export type MermaidProps = {
  chart: string;
};

type RenderState =
  | { status: 'loading' }
  | { status: 'ok'; svg: string }
  | { status: 'error'; message: string };

export const Mermaid = ({ chart }: MermaidProps) => {
  const id = useId().replace(/:/g, '');
  const [state, setState] = useState<RenderState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    mermaid.render(`mermaid-${id}`, chart)
      .then(({ svg }) => {
        if (!cancelled) setState({ status: 'ok', svg });
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

  if (state.status === 'error') {
    return <pre className={styles.error}>Failed to render diagram: {state.message}</pre>;
  }

  if (state.status === 'loading') {
    return <div className={styles.placeholder} aria-hidden="true" />;
  }

  return <div className={styles.view} dangerouslySetInnerHTML={{ __html: state.svg }} />;
};

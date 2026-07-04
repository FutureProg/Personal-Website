import { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';
import styles from './Mermaid.module.css';

mermaid.initialize({ startOnLoad: false, theme: 'default' });

export type MermaidProps = {
  chart: string;
};

export const Mermaid = ({ chart }: MermaidProps) => {
  const id = useId().replace(/:/g, '');
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    mermaid.render(`mermaid-${id}`, chart)
      .then(({ svg }) => {
        if (!cancelled) setSvg(svg);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return <pre className={styles.error}>Failed to render diagram: {error}</pre>;
  }

  if (!svg) {
    return <div className={styles.placeholder} aria-hidden="true" />;
  }

  return <div className={styles.view} dangerouslySetInnerHTML={{ __html: svg }} />;
};

import { useEffect, useId, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch';
import styles from './Mermaid.module.css';
import { IconButton } from './IconButton';
import { Modal } from './Modal';
import ExpandIcon from '../images/expand-icon.svg';

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
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchContentRef>(null);

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

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.view} dangerouslySetInnerHTML={{ __html: state.svg }} />
      <IconButton
        icon={<img src={ExpandIcon} alt="" />}
        label="Expand diagram"
        className={styles.expandButton}
        onClick={() => setExpanded(true)}
      />
      <Modal
        open={expanded}
        onClose={() => setExpanded(false)}
        label="Diagram viewer"
        headerActions={
          <>
            <IconButton icon={<span aria-hidden>+</span>} label="Zoom in" onClick={() => transformRef.current?.zoomIn()} />
            <IconButton icon={<span aria-hidden>−</span>} label="Zoom out" onClick={() => transformRef.current?.zoomOut()} />
            <IconButton icon={<span aria-hidden>⟲</span>} label="Reset zoom" onClick={() => transformRef.current?.resetTransform()} />
          </>
        }
      >
        <TransformWrapper ref={transformRef} centerOnInit>
          <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
            <div className={styles.expandedView} dangerouslySetInnerHTML={{ __html: state.svg }} />
          </TransformComponent>
        </TransformWrapper>
      </Modal>
    </div>
  );
};

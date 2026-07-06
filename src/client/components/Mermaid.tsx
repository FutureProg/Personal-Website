import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import mermaid from 'mermaid';
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch';
import styles from './Mermaid.module.css';
import { IconButton } from './IconButton';
import { Modal } from './Modal';
import ExpandIcon from '../images/expand-icon.svg';

mermaid.initialize({ startOnLoad: false, theme: 'default' });

const PAN_STEP = 40;

export type MermaidProps = {
  chart: string;
};

type RenderState =
  | { status: 'loading' }
  | { status: 'ok'; svg: string; bindFunctions: ((el: Element) => void) | undefined }
  | { status: 'error'; message: string };

export const Mermaid = ({ chart }: MermaidProps) => {
  const id = useId().replace(/:/g, '');
  const panHintId = `mermaid-pan-hint-${id}`;
  const [state, setState] = useState<RenderState>({ status: 'loading' });
  const [expanded, setExpanded] = useState(false);
  const [reservedHeight, setReservedHeight] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchContentRef>(null);
  const panRegionRef = useRef<HTMLDivElement>(null);

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
  }, [state, expanded]);

  useEffect(() => {
    if (expanded) panRegionRef.current?.focus();
  }, [expanded]);

  const handleExpand = () => {
    // The inline diagram unmounts while expanded (see `diagram` below), so its height
    // is captured here to reserve `.wrapper`'s space and avoid a layout jump on open/close.
    setReservedHeight(containerRef.current?.getBoundingClientRect().height ?? null);
    setExpanded(true);
  };

  const handlePanKeyDown = (e: KeyboardEvent) => {
    const transform = transformRef.current;
    if (!transform) return;
    const { positionX, positionY, scale } = transform.state;
    switch (e.key) {
      case 'ArrowUp':
        transform.setTransform(positionX, positionY + PAN_STEP, scale, 100);
        break;
      case 'ArrowDown':
        transform.setTransform(positionX, positionY - PAN_STEP, scale, 100);
        break;
      case 'ArrowLeft':
        transform.setTransform(positionX + PAN_STEP, positionY, scale, 100);
        break;
      case 'ArrowRight':
        transform.setTransform(positionX - PAN_STEP, positionY, scale, 100);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  if (state.status === 'error') {
    return <pre className={styles.error}>Failed to render diagram: {state.message}</pre>;
  }

  if (state.status === 'loading') {
    return <div className={styles.placeholder} aria-hidden="true" />;
  }

  // Rendered once and moved between the inline and expanded slots below (never both at
  // once), since state.svg's ids would otherwise collide if mounted in two places at once.
  const diagram = (
    <div
      ref={containerRef}
      className={expanded ? styles.expandedView : styles.view}
      dangerouslySetInnerHTML={{ __html: state.svg }}
    />
  );

  return (
    <div className={styles.wrapper} style={expanded && reservedHeight ? { minHeight: reservedHeight } : undefined}>
      {!expanded && diagram}
      <IconButton
        icon={<img src={ExpandIcon} alt="" />}
        label="Expand diagram"
        className={styles.expandButton}
        onClick={handleExpand}
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
        {expanded && (
          <div
            ref={panRegionRef}
            className={styles.panRegion}
            tabIndex={0}
            role="group"
            aria-label="Diagram viewport"
            aria-describedby={panHintId}
            onKeyDown={handlePanKeyDown}
          >
            <span id={panHintId} className={styles.visuallyHidden}>
              Use arrow keys to pan.
            </span>
            <TransformWrapper ref={transformRef} centerOnInit>
              <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>{diagram}</TransformComponent>
            </TransformWrapper>
          </div>
        )}
      </Modal>
    </div>
  );
};


import React, { useEffect, useRef, useState } from 'react';

type Props = {
  height?: number;
  className?: string;
  children: React.ReactNode;
};

export const SafeChartContainer: React.FC<Props> = ({
  height = 320,
  className,
  children,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setWidth(w);
      }
    });

    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);

    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        width: '100%',
        height,
        display: 'block',
      }}
    >
      {width > 0 ? (
        children
      ) : (
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: 14,
          }}
        >
          Carregando gráfico…
        </div>
      )}
    </div>
  );
};

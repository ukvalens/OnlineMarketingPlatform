import useBreakpoint from '../../hooks/useBreakpoint';

export default function ResponsiveTable({ children, minWidth = 520 }) {
  const { below } = useBreakpoint();
  return (
    <div style={below('md') ? { overflowX: 'auto', WebkitOverflowScrolling: 'touch' } : {}}>
      <div style={below('md') ? { minWidth } : {}}>
        {children}
      </div>
    </div>
  );
}

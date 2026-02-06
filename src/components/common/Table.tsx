import { ReactNode } from 'react';

interface TableProps {
  headers: string[];
  children: ReactNode;
}

export function Table({ headers, children }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border-separate border-spacing-0">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="text-left text-xs text-[rgba(224,242,254,.75)] px-2.5 py-2.5 border-b border-[#444444]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

interface TableRowProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function TableRow({ children, onClick, className }: TableRowProps) {
  return (
    <tr
      className={`hover:bg-[rgba(2,132,199,.06)] transition-colors ${onClick ? 'cursor-pointer' : ''} ${className || ''}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export function TableCell({ children, className }: TableCellProps) {
  return (
    <td className={`px-2.5 py-3 border-b border-[#444444] text-sm text-[rgba(224,242,254,.95)] ${className || ''}`}>
      {children}
    </td>
  );
}



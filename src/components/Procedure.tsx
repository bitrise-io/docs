import React from 'react';

interface ProcedureProps {
  children: React.ReactNode;
}

export default function Procedure({ children }: ProcedureProps) {
  return <ol className="procedure">{children}</ol>;
}

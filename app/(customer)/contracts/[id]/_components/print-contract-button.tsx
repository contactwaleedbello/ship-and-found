'use client';

import type { ReactNode } from 'react';

export function PrintContractButton(): ReactNode {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined') window.print();
      }}
      className="bg-primary text-primary-on rounded-button px-btn-px py-btn-py type-label-large inline-flex items-center justify-center self-start"
    >
      Print Contract Agreement
    </button>
  );
}

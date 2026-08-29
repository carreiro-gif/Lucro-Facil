import React, { useState, useRef, useEffect } from 'react';
import { FileText, Printer, ChevronDown, Download, Loader2 } from 'lucide-react';

interface ExportReportButtonProps {
  onExportPDF: () => void | Promise<void>;
  onPrint?: () => void;
  title?: string;
  className?: string;
}

export const ExportReportButton: React.FC<ExportReportButtonProps> = ({
  onExportPDF,
  onPrint,
  title = 'Exportar PDF',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setIsOpen(false);
      await Promise.resolve(onExportPDF());
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    setIsOpen(false);
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className={`relative inline-flex items-center rounded-xl shadow-sm ${className}`} ref={dropdownRef}>
      {/* Primary Export PDF Button */}
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        title="Baixar relatório formatado em PDF"
        className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/80 rounded-l-xl font-bold text-xs shadow-sm transition active:scale-[0.98] disabled:opacity-60 cursor-pointer"
      >
        {isExporting ? (
          <Loader2 size={15} className="animate-spin text-brand-red" />
        ) : (
          <FileText size={15} className="text-brand-red shrink-0" />
        )}
        <span>{isExporting ? 'Gerando PDF...' : title}</span>
      </button>

      {/* Split Dropdown Toggle for Print option */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Mais opções de relatório"
        className="px-2 py-2.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-y border-r border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/80 rounded-r-xl transition active:scale-[0.98] cursor-pointer"
      >
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 animate-fade-in text-xs">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium"
          >
            <Download size={14} className="text-brand-red" />
            <span>Baixar PDF (A4)</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium"
          >
            <Printer size={14} className="text-blue-600 dark:text-blue-400" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      )}
    </div>
  );
};

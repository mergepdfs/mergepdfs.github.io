import React, { useState, useRef, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import fileSaver from 'file-saver';
const { saveAs } = fileSaver;
import { UploadCloud, FileText, ArrowUp, ArrowDown, Trash2, Merge, Split, Download, Loader2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function PdfTool() {
  const [activeTab, setActiveTab] = useState('merge');
  
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('merge')}
            className={cn(
              "flex-1 py-4 px-6 text-center font-medium transition-colors flex items-center justify-center gap-2",
              activeTab === 'merge' 
                ? "bg-red-50 text-red-700 border-b-2 border-red-600" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            )}
          >
            <Merge size={18} />
            Merge PDFs
          </button>
          <button
            onClick={() => setActiveTab('split')}
            className={cn(
              "flex-1 py-4 px-6 text-center font-medium transition-colors flex items-center justify-center gap-2",
              activeTab === 'split' 
                ? "bg-red-50 text-red-700 border-b-2 border-red-600" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            )}
          >
            <Split size={18} />
            Split PDF
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-8">
          {activeTab === 'merge' ? <MergeTool /> : <SplitTool />}
        </div>
      </div>
    </div>
  );
}

function MergeTool() {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
    if (selected.length > 0) {
      setFiles(prev => [...prev, ...selected]);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (dropped.length > 0) {
      setFiles(prev => [...prev, ...dropped]);
    }
  }, []);

  const moveUp = (index) => {
    if (index === 0) return;
    setFiles(prev => {
      const newFiles = [...prev];
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      return newFiles;
    });
  };

  const moveDown = (index) => {
    if (index === files.length - 1) return;
    setFiles(prev => {
      const newFiles = [...prev];
      [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
      return newFiles;
    });
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError("Please add at least two PDF files to merge.");
      return;
    }
    setError(null);
    setIsProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, 'merged-document.pdf');
    } catch (err) {
      console.error(err);
      setError("An error occurred while merging the PDFs.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Drag & drop PDFs here</h3>
        <p className="text-sm text-slate-500 mb-4">or click to select files</p>
        <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
          Browse Files
        </button>
        <input 
          type="file" 
          multiple 
          accept="application/pdf" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="font-medium text-slate-800">Selected Files ({files.length})</h4>
          <div className="flex flex-col gap-2">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="text-red-500 flex-shrink-0" size={20} />
                  <span className="truncate text-sm font-medium text-slate-700">{file.name}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => moveUp(index)} disabled={index === 0} aria-label="Move file up" title="Move file up" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400">
                    <ArrowUp size={18} aria-hidden="true" />
                  </button>
                  <button onClick={() => moveDown(index)} disabled={index === files.length - 1} aria-label="Move file down" title="Move file down" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400">
                    <ArrowDown size={18} aria-hidden="true" />
                  </button>
                  <button onClick={() => removeFile(index)} aria-label="Remove file" title="Remove file" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded ml-1">
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <button 
        onClick={handleMerge}
        disabled={files.length < 2 || isProcessing}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
      >
        {isProcessing ? <Loader2 className="animate-spin" /> : <Merge size={20} />}
        {isProcessing ? "Merging PDFs..." : "Merge PDFs"}
      </button>
    </div>
  );
}

function SplitTool() {
  const [file, setFile] = useState(null);
  const [splitMode, setSplitMode] = useState('all'); // 'all' or 'custom'
  const [customRange, setCustomRange] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError(null);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped);
      setError(null);
    }
  }, []);

  const parseRange = (rangeStr, maxPages) => {
    const pages = new Set();
    const parts = rangeStr.split(',').map(s => s.trim());
    
    for (const part of parts) {
      if (!part) continue;
      
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(num => parseInt(num.trim(), 10));
        if (isNaN(start) || isNaN(end) || start < 1 || end > maxPages || start > end) {
          throw new Error(`Invalid range: ${part}`);
        }
        for (let i = start; i <= end; i++) {
          pages.add(i - 1); // 0-indexed for pdf-lib
        }
      } else {
        const num = parseInt(part, 10);
        if (isNaN(num) || num < 1 || num > maxPages) {
          throw new Error(`Invalid page number: ${part}`);
        }
        pages.add(num - 1); // 0-indexed
      }
    }
    
    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleSplit = async () => {
    if (!file) return;
    setError(null);
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pageCount = pdf.getPageCount();

      if (splitMode === 'custom') {
        if (!customRange.trim()) {
          throw new Error("Please enter a valid page range.");
        }
        
        const indicesToKeep = parseRange(customRange, pageCount);
        if (indicesToKeep.length === 0) {
          throw new Error("No valid pages selected.");
        }

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdf, indicesToKeep);
        copiedPages.forEach((page) => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        saveAs(blob, `split-${file.name}`);
      } else {
        // Extract all pages as ZIP
        const zip = new JSZip();
        
        for (let i = 0; i < pageCount; i++) {
          const singlePagePdf = await PDFDocument.create();
          const [copiedPage] = await singlePagePdf.copyPages(pdf, [i]);
          singlePagePdf.addPage(copiedPage);
          
          const pdfBytes = await singlePagePdf.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          
          // Format filename like original-name-page-1.pdf
          const baseName = file.name.replace('.pdf', '');
          zip.file(`${baseName}-page-${i + 1}.pdf`, blob);
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `${file.name.replace('.pdf', '')}-split-pages.zip`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while splitting the PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {!file ? (
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Drag & drop a PDF here</h3>
          <p className="text-sm text-slate-500 mb-4">or click to select file</p>
          <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
            Browse File
          </button>
          <input 
            type="file" 
            accept="application/pdf" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileText className="text-red-500 flex-shrink-0" size={24} />
              <span className="truncate font-medium text-slate-800">{file.name}</span>
            </div>
            <button 
              onClick={() => setFile(null)} 
              className="text-sm font-medium text-red-600 hover:text-red-800 ml-4 flex-shrink-0"
            >
              Change File
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-medium text-slate-800">Split Options</h4>
            
            <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input 
                type="radio" 
                name="splitMode" 
                value="all" 
                checked={splitMode === 'all'}
                onChange={() => setSplitMode('all')}
                className="mt-1 text-red-600 focus:ring-red-500"
              />
              <div>
                <div className="font-medium text-slate-800">Extract every page</div>
                <div className="text-sm text-slate-500">Each page will be saved as a separate PDF file. Downloaded as a ZIP archive.</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input 
                type="radio" 
                name="splitMode" 
                value="custom" 
                checked={splitMode === 'custom'}
                onChange={() => setSplitMode('custom')}
                className="mt-1 text-red-600 focus:ring-red-500"
              />
              <div className="flex-grow">
                <div className="font-medium text-slate-800">Custom Range</div>
                <div className="text-sm text-slate-500 mb-2">Extract specific pages or page ranges.</div>
                {splitMode === 'custom' && (
                  <input
                    type="text"
                    value={customRange}
                    onChange={(e) => setCustomRange(e.target.value)}
                    placeholder="e.g. 1-5, 8, 11-13"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <button 
            onClick={handleSplit}
            disabled={isProcessing || (splitMode === 'custom' && !customRange.trim())}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : <Split size={20} />}
            {isProcessing ? "Processing..." : "Split PDF"}
          </button>
        </div>
      )}
    </div>
  );
}

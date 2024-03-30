import React from 'react';
import MyCustomPDFRenderer from "@/renderers/MyCustomPDFRenderer";

interface CurrentDocument {
  fileData: string | null;
  fileName: string;
}

interface MainState {
  currentDocument: CurrentDocument;
}

interface FileViewerProps {
  docData: string | null;
}

const FileViewer: React.FC<FileViewerProps> = ({ docData }) => {

// Main state for the document
  const mainState: MainState = {
    currentDocument: {
      fileData: docData,
      fileName: 'Document'
    }
  };


  return (
      <div>
        {/* Directly rendering MyCustomPDFRenderer */}
        <MyCustomPDFRenderer mainState={mainState} />
      </div>
  );
};

export default FileViewer;
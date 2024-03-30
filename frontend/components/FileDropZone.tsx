import React, { useState, useRef, FC } from 'react';

interface FileDropZoneProps {
    onFilesSelected: (files: File[]) => void;
  }
  

const FileDropZone: FC<FileDropZoneProps> = ({ onFilesSelected }) => {
  const [files, setFiles] = useState<Array<{file: File, id: number}>>([]);
  const [typeError, setTypeError] = useState<string>('');
  const [sizeError, setSizeError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFiles = files.length > 0;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {    
    if (event.target.files) {
      for (let i = 0; i < event.target.files.length; i++) {
        validateFile(event.target.files[i]);
      }
    }
    if (event.target.files && event.target.files.length > 0) {
        const fileArray = Array.from(event.target.files);
        onFilesSelected(fileArray); // Call the callback with the selected file
      }
  };

  const validateFile = (selectedFile: File) => {
    const fileSize = selectedFile.size / 1024 / 1024; // in MB
    const validTypes = ['pdf']; //'docx', 'txt', 
    const fileType = selectedFile.name.split('.').pop()?.toLowerCase();

    if (!fileType || !validTypes.includes(fileType)) {
      setTypeError('Invalid file type.');
    } else if (fileSize > 10) {
      setSizeError('File size exceeds limit.');
    } else {
      setTypeError('');
      setSizeError('');
      setFiles(prevFiles => [...prevFiles, {file: selectedFile, id: Math.random()}]);
    }
  };


  const validateFileNoAction = (selectedFile: File) => {
    const fileSize = selectedFile.size / 1024 / 1024; // in MB
    const validTypes = ['pdf']; //'docx', 'txt', 
    const fileType = selectedFile.name.split('.').pop()?.toLowerCase();

    if (!fileType || !validTypes.includes(fileType)) {
      return false;
    } else if (fileSize > 10) {
      return false;
    } else {
      return true;
    }
  };


  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {

    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;

    if (droppedFiles) {
      const validFiles: File[] = [];
      for (let i = 0; i < droppedFiles.length; i++) {
        if (validateFileNoAction(droppedFiles[i])) {
          validFiles.push(droppedFiles[i]);
        }
        else {
            validateFile(droppedFiles[i]);
        }
      }
      if (validFiles.length > 0) {
        setFiles(prevFiles => [...prevFiles, ...validFiles.map(file => ({ file, id: Math.random() }))]);

        // Clear errors, looks better for UI to not show errors after valid files are dropped
        setTypeError('');

        onFilesSelected(validFiles);
      }
    }
  };

  const handleFileClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
        fileInputRef.current?.click();
    }
  };

  const removeFile = (id: number) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== id));
  };

  return (
    <div 
      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-700 hover:border-gray-500 hover:bg-gray-100 flex flex-col justify-center items-center"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={handleFileClick}
      style={{ width:"90%", height:"25vh", marginLeft:"50px" }}
    >
      {!hasFiles && (
        <div>
        <p>Drag and drop your file here or click to select a file</p>
      <p className="text-sm text-gray-500">Only .pdf files can be uploaded (Max size: 10MB)</p>
      {/* <p className="text-sm text-gray-500">Only .docx, .txt, and .pdf files (Max size: 10MB)</p> */}

      </div>
      )}
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
      {typeError && <p className="text-red-500 mt-4">{typeError}</p>}
      {sizeError && <p className="text-red-500 mt-4">{sizeError}</p>}
      <ul className="list-none mt-4 w-full">
        {files.map(file => (
          <li key={file.id} className="flex items-center bg-gray-100 p-2 m-1 rounded -mb-4">
            <span className="mr-2">{file.file.name} - {(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
            <button onClick={() => removeFile(file.id)} className="text-lg text-red-400" style={{fontSize:"25px",paddingBottom:"4px"}}>
            ×
</button>

          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileDropZone;

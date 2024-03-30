# SemanticPDF: Drag, Drop, Semantic Search

![License](https://img.shields.io/badge/license-MIT-green)

SemanticPDF is a simple, privacy-focused application that makes it easy to upload a PDF file and perform a semantic search on contents. With a minimalist drag-and-drop interface, SemanticPDF makes it effortless to search through a file intelligently when an exact keyword search is lacking. For instance, you can search through a book for "the author's opinion on the future of artificial intelligence" or locate sections of an economics research paper that speak to "the long term impact" of the studied topic. 

[SemanticPDF Video](https://github.com/Bklieger/Semantic/assets/62450410/ab3616c5-beeb-429b-9044-8bd0835f83d3)
> The design and frontend code for SemanticPDF was inspired by Liftoff ([Github](https://github.com/Tameyer41/liftoff), MIT License) by Tyler Meyer.

SemanticPDF's design philosophy focuses on privacy by not storing any of the files or embeddings in a database, using the browser's local storage and an open source embeddings model instead of sharing or storing data with a third-party API.


## Features

- 🔒 Privacy-focused: All files, text, and embeddings are stored locally in your browser, keeping your data private by not storing the files or embeddings in any database.
- 💰 Zero API costs: SemanticPDF utilizes open-source models and libraries for file-to-text conversion, embedding, and semantic search, eliminating the need for any third-party APIs.
- 📂 Simple User Interface: Seamlessly upload your PDF file with an intuitive drag-and-drop interface and navigate the pages of the file.
- 🔍 Semantic search: Quickly find relevant information within your PDF files using semantic search capabilities.

### Architecture

- Next.js Frontend
- FastAPI Backend

### Installation


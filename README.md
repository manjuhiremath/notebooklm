
```markdown
# NotebookLM Clone

A full-stack AI-powered PDF Q&A application that enables users to upload documents and interact with them through an intelligent chat interface. Built with Next.js, Gemini AI, and Pinecone Vector Database.

## LIVE LINK : https://notebooklm.manjuhiremath.in/ or https://notebooklm-alpha.vercel.app/

## Features

### Core Functionality
 **PDF Upload & Processing**
- Drag-and-drop PDF upload interface
- Support for files up to 50MB
- Real-time upload progress tracking (0-100%)
- Instant text extraction and indexing

 **Side-by-Side Interface**
- Live PDF viewer on the left (50%)
- Interactive chat on the right (50%)
- Responsive split-view layout
- Zoom and navigation controls
- Download PDF functionality

 **AI-Powered Q&A**
- Ask questions about document content
- Instant answers powered by Gemini 2.5 Flash
- Citation links to specific PDF pages
- Confidence scores for answers
- Copy answers to clipboard

 **Advanced Features**
- Semantic search with vector embeddings
- Vector storage in Pinecone
- Page-level citation tracking
- Professional UI with Tailwind CSS
- Real-time loading states
- Error handling and user feedback

## Architecture

### Tech Stack

**Frontend**
- Next.js 15 (App Router)
- React 18
- Tailwind CSS v3
- Lucide React Icons
- Client-side state management

**Backend**
- Next.js API Routes (Node.js runtime)
- Server-side PDF processing
- Async/await patterns

**AI & Data**
- Gemini API (embeddings + chat)
- Gemini Embedding 001 (1024 dimensions)
- Gemini 2.5 Flash (chat model)
- Pinecone Vector Database
- UNPDF (PDF text extraction)

### Data Flow

```
User Upload PDF
    ↓
Text Extraction (UNPDF)
    ↓
Chunking (1000 characters)
    ↓
Embedding Generation (Gemini API)
    ↓
Pinecone Vector Storage
    ↓
User Question
    ↓
Question Embedding
    ↓
Semantic Search (Pinecone - Top 5 results)
    ↓
Context Assembly
    ↓
LLM Generation (Gemini 2.5 Flash)
    ↓
Response + Citations
```

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Gemini API key ([get from here](https://aistudio.google.com))
- Pinecone API key ([get from here](https://www.pinecone.io))

## 🚀 Installation

### Step 1: Clone Repository
```
git clone <your-repo-url>
cd notebooklm-clone
```

### Step 2: Install Dependencies
```
npm install
```

### Step 3: Environment Setup

Create `.env.local` in the root directory:

```
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_EMBED_MODEL=gemini-embedding-001
GEMINI_CHAT_MODEL=gemini-2.5-flash

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX=notebooklm-pdf
```

### Step 4: Create Uploads Directory
```
mkdir -p public/uploads
touch public/uploads/.gitkeep
```

### Step 5: Run Development Server
```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
notebooklm-clone/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload/
│   │   │   │   └── route.js          # PDF upload & embedding API
│   │   │   └── chat/
│   │   │       └── route.js          # Q&A API endpoint
│   │   ├── page.js                   # Main application (split view)
│   │   ├── layout.js                 # Root layout
│   │   └── globals.css               # Global styles
│   └── components/
│       ├── PDFUploader.js            # Upload interface with progress
│       ├── ChatBox.js                # Chat interface with citations
│       ├── PDFViewer.js              # PDF display (embed tag)
│       └── UploadProgress.js         # Progress modal dialog
├── utils/
│   └── pineconeClient.js             # Pinecone integration
├── public/
│   └── uploads/                      # Uploaded PDF files
├── .env.local                        # Environment variables
├── package.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

##  API Endpoints

### POST `/api/upload`
Uploads a PDF and creates embeddings.

**Request:**
```
curl -X POST http://localhost:3000/api/upload \
  -F "file=@document.pdf"
```

**Response:**
```
{
  "status": "vectorized",
  "vectorCount": 45,
  "chunksProcessed": 45,
  "totalPages": 10,
  "embeddingDimension": 1024,
  "pdfUrl": "/uploads/1730000000000_document.pdf",
  "fileName": "document.pdf"
}
```

### POST `/api/chat`
Sends a question and receives an AI answer.

**Request:**
```
{
  "question": "What is the main topic?"
}
```

**Response:**
```
{
  "answer": "The document primarily discusses...",
  "sources": 3,
  "confidence": "0.8534",
  "citations": [
    {
      "page": 2,
      "score": 0.8534
    }
  ]
}
```

## 💡 Usage

1. **Upload PDF**: Drag and drop or click to browse
2. **Wait for Processing**: Monitor progress bar (0-100%)
3. **Ask Questions**: Type in the chat input
4. **View Answers**: Read responses with citations
5. **Navigate Pages**: Click "Page X" buttons to jump to cited pages
6. **Download**: Use download button to save PDF

## ⚙️ Configuration

### Change PDF Chunk Size
Edit `/src/app/api/upload/route.js`:
```
const chunks = text.match(/(.|[\r\n]){1,1000}/g) || [];
// Change 1000 to desired size
```

### Adjust Embedding Dimension
Update in `.env.local`:
```
# Supported: 768, 1024
EMBEDDING_DIMENSION=1024
```

### Modify AI Models
Update in `.env.local`:
```
GEMINI_API_KEY={your_gemini_api_key_here}
GEMINI_EMBED_MODEL=gemini-embedding-001
GEMINI_CHAT_MODEL=gemini-2.5-flash
VECTOR_BACKEND=faiss

# Pinecone (optional)
PINECONE_API_KEY={your_pinecone_api_key_here}
PINECONE_INDEX={your_pinecone_index_name_here}  # <--- change index name as needed for your project

```

## Deployment

### Vercel (Recommended)
```
npm i -g vercel
vercel
# Add environment variables in Vercel dashboard
```

### Netlify
1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish: `.next`
4. Add env variables
5. Deploy

### Render
1. Create Web Service
2. Connect GitHub
3. Add environment variables
4. Deploy

## Troubleshooting

### PDF Not Loading
- Verify file is at `/public/uploads/[filename]`
- Check GEMINI_API_KEY validity
- Clear browser cache

### "Page blocked by Chrome"
- Use embed tag (already configured)
- No COEP/COOP headers set
- Try Firefox or Safari

### Embeddings Failed
- Verify Pinecone API key
- Check index name matches
- Ensure API quota available

### Chat Not Responding
- Check Gemini API key
- Verify Pinecone namespace: `notebooklm-upload`
- Check browser console for errors

## Performance

- PDF extraction: 2-5 seconds
- Embedding generation: 10-30 seconds
- Semantic search: <100ms
- Chat response: 2-5 seconds

## Technologies

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Next.js API Routes
- **AI**: Google Gemini API
- **Vector DB**: Pinecone
- **PDF**: UNPDF library
- **Icons**: Lucide React

##  License

MIT License - feel free to use for personal or commercial projects.

##  Contributing

Contributions welcome! Please feel free to submit issues and pull requests.

##  Support

For issues or questions:
- Check the troubleshooting section
- Review API documentation
- Check browser console for errors

##  Author

Built with ❤️ for AI enthusiasts

---

**Made with 🚀 Next.js, Gemini API & Pinecone**

Last updated: November 5, 2025


